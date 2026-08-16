import { Controller, Post, Get, Body, Param, UseGuards, Request, Res, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma.service';
import axios from 'axios';

@Controller('learning/tutor')
@UseGuards(JwtAuthGuard)
export class TutorController {
    private readonly deepseekKey: string;

    constructor(private prisma: PrismaService) {
        this.deepseekKey = process.env.DEEPSEEK_API_KEY ?? '';
    }

    @Get('sessions')
    async getSessions(@Request() req: any) {
        return this.prisma.tutorSession.findMany({
            where: { userId: req.user.userId },
            orderBy: { updatedAt: 'desc' }
        });
    }

    @Get('sessions/:id/messages')
    async getMessages(@Param('id') sessionId: string, @Request() req: any) {
        const session = await this.prisma.tutorSession.findUnique({
            where: { id: sessionId, userId: req.user.userId }
        });
        if (!session) throw new BadRequestException('Session not found');

        return this.prisma.tutorMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' }
        });
    }

    @Post('chat')
    async chat(
        @Body() dto: { sessionId?: string; message: string; systemPrompt?: string },
        @Request() req: any,
        @Res() res: Response
    ) {
        // Enforce paywall for Tutor
        if (req.user.tier === 'FREE') {
            return res.status(403).json({ message: 'AI Tutor is only available for Gold members.' });
        }

        let sessionId = dto.sessionId;
        let isNewSession = false;

        if (!sessionId) {
            const session = await this.prisma.tutorSession.create({
                data: {
                    userId: req.user.userId,
                    title: dto.message.substring(0, 30) + (dto.message.length > 30 ? '...' : '')
                }
            });
            sessionId = session.id;
            isNewSession = true;
        } else {
            // Verify ownership
            const session = await this.prisma.tutorSession.findUnique({ where: { id: sessionId } });
            if (!session || session.userId !== req.user.userId) {
                return res.status(403).json({ message: 'Invalid session' });
            }
        }

        // Save user message
        await this.prisma.tutorMessage.create({
            data: {
                sessionId,
                role: 'user',
                content: dto.message
            }
        });

        // Fetch last 10 messages for context
        const history = await this.prisma.tutorMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' },
            take: 10
        });

        const messages = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }));

        // Prepend system prompt
        const systemInstruction = dto.systemPrompt || `You are an expert AI tutor for the Setorial learning platform. 
Provide clear, educational, and accurate answers.
If the user's question is inappropriate, violent, hate speech, or completely non-educational nonsense, politely refuse to answer.
IMPORTANT MATH FORMATTING: All mathematical expressions MUST use LaTeX wrapped in dollar-sign delimiters.
Use $...$ for inline math and $$...$$ for display equations.
Examples: $\\frac{a}{b}$, $\\sqrt{x}$, $\\sec^2(x)$, $$E = mc^2$$
NEVER use plain Unicode superscripts (like x² or √x) or raw carets (like x^2). Always use LaTeX.`;

        messages.unshift({ role: 'system', content: systemInstruction });

        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Send initial session ID info as a custom event so frontend knows the ID
        if (isNewSession) {
            res.write(`event: session\ndata: {"sessionId": "${sessionId}"}\n\n`);
        }

        try {
            const response = await axios.post(
                'https://api.deepseek.com/chat/completions',
                {
                    model: 'deepseek-chat',
                    messages: messages,
                    stream: true,
                    max_tokens: 4096
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.deepseekKey}`,
                        'Accept': 'text/event-stream'
                    },
                    responseType: 'stream'
                }
            );

            let fullAssistantMessage = '';

            response.data.on('data', (chunk: Buffer) => {
                const lines = chunk.toString('utf8').split('\n').filter(line => line.trim() !== '');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '');
                        if (dataStr === '[DONE]') {
                            res.write('data: [DONE]\n\n');
                            break;
                        }
                        try {
                            const parsed = JSON.parse(dataStr);
                            const text = parsed.choices[0]?.delta?.content || '';
                            fullAssistantMessage += text;
                            res.write(`data: ${JSON.stringify({ text })}\n\n`);
                        } catch (e) {
                            // Ignored JSON parse error for incomplete chunks
                        }
                    }
                }
            });

            response.data.on('end', async () => {
                // Save assistant message when stream ends
                await this.prisma.tutorMessage.create({
                    data: {
                        sessionId,
                        role: 'assistant',
                        content: fullAssistantMessage
                    }
                });
                res.end();
            });

            response.data.on('error', (err: any) => {
                res.write(`event: error\ndata: {"error": "stream_interrupted"}\n\n`);
                res.end();
            });

        } catch (error: any) {
            res.write(`event: error\ndata: {"error": "${error.message}"}\n\n`);
            res.end();
        }
    }
}
