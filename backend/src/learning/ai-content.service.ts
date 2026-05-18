import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import axios from 'axios';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AiContentService {
    private readonly logger = new Logger(AiContentService.name);
    // User requested specifically to use this DeepSeek key
    private readonly deepseekKey = 'sk-1e93663ccdbd4d4e9ee1f6144a7271d3';

    constructor(
        private prisma: PrismaService,
        @InjectQueue('ai-content') private aiQueue: Queue
    ) { }

    async queueFullSyllabusGeneration(subjectId: string, numTopics: number, userRole?: string) {
        await this.aiQueue.add('generate-full-subject', { subjectId, numTopics, userRole }, {
            removeOnComplete: true,
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 }
        });
        return { message: 'Wormhole opened. Generating syllabus in the background...' };
    }

    async generateLevelsForTopic(subjectId: string, topicName: string, numLevels: number = 3, userRole?: string) {
        const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject) throw new Error('Subject not found');

        const isApproved = userRole === 'TUTOR' ? false : true;

        let topic = await this.prisma.topic.findFirst({
            where: { name: topicName, subjectId }
        });
        if (!topic) {
            topic = await this.prisma.topic.create({
                data: { name: topicName, subjectId, isApproved }
            });
        }

        // Step 1: Discover Lesson Titles
        const titlePrompt = `For the subject "${subject.name}" and the topic "${topicName}", suggest exactly ${numLevels} textbook chapter titles in logical learning order.
Respond ONLY with a JSON object:
{
  "titles": ["Chapter 1 Name", "Chapter 2 Name", ...]
}`;

        const { titles } = await this.executeGeneration(titlePrompt, async (data) => data);

        // Step 2: Generate Deep Content for each title
        const createdLessons = [];
        for (let i = 0; i < titles.length; i++) {
            const lessonData = await this.generateLessonContent(subject.name, topicName, titles[i]);
            const lesson = await this.prisma.lesson.create({
                data: {
                    name: titles[i],
                    topicId: topic.id,
                    content: lessonData.content,
                    order: i + 1,
                    isApproved,
                    questions: {
                        create: lessonData.questions.map((q: any) => ({
                            text: q.text,
                            options: q.options,
                            correctOption: q.correctOption
                        }))
                    }
                },
                include: { questions: true }
            });
            createdLessons.push(lesson);
        }

        return { topic, levels: createdLessons };
    }

    private async generateLessonContent(subjectName: string, topicName: string, lessonName: string) {
        const prompt = `You are writing a professional textbook chapter.
Subject: "${subjectName}".
Topic: "${topicName}".
Chapter Title: "${lessonName}".

Provide high-depth textbook-style content (~800-1200 words). Include sections like "Introduction", "Core Principles", "Detailed Analysis", "Practical Examples", and "Summary". 
Also generate 5 challenging multiple-choice questions based on this specific content.

IMPORTANT MATH FORMATTING: All mathematical expressions MUST use LaTeX wrapped in dollar-sign delimiters.
Use $...$ for inline math and $$...$$ for display equations.
Examples: $\\frac{a}{b}$, $\\sqrt{x}$, $\\sec^2(x)$, $$E = mc^2$$
NEVER use plain Unicode superscripts (like x² or √x) or raw carets (like x^2). Always use LaTeX.

Respond ONLY with valid JSON:
{
  "content": "Full textbook markdown...",
  "questions": [ { "text": "...", "options": ["A", "B", "C", "D"], "correctOption": 0 } ]
}`;

        return this.executeGeneration(prompt, async (data) => data);
    }

    async regenerateLesson(lessonId: string, userRole?: string) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { topic: { include: { subject: true } } }
        });
        if (!lesson) throw new Error('Lesson not found');

        const data = await this.generateLessonContent(
            lesson.topic.subject.name,
            lesson.topic.name,
            lesson.name
        );

        const isApproved = userRole === 'TUTOR' ? false : true;

        return await this.prisma.$transaction(async (tx) => {
            await tx.question.deleteMany({ where: { lessonId } });
            return tx.lesson.update({
                where: { id: lessonId },
                data: {
                    content: data.content,
                    isApproved,
                    questions: {
                        create: data.questions.map((q: any) => ({
                            text: q.text,
                            options: q.options,
                            correctOption: q.correctOption
                        }))
                    }
                },
                include: { questions: true }
            });
        });
    }

    async generateMockExam(subjectId: string, title: string, numQuestions: number = 30, userRole?: string) {
        const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject) throw new Error('Subject not found');

        const isApproved = userRole === 'TUTOR' ? false : true;

        const prompt = `Create a professional standardized mock exam for the subject "${subject.name}".
Title: "${title}".
Generate exactly ${numQuestions} diverse, high-quality multiple choice questions covering various topics in this subject.

IMPORTANT MATH FORMATTING: All mathematical expressions MUST use LaTeX wrapped in dollar-sign delimiters.
Use $...$ for inline math and $$...$$ for display equations.
Examples: $\\frac{a}{b}$, $\\sqrt{x}$, $\\sec^2(x)$, $$E = mc^2$$
NEVER use plain Unicode superscripts (like x² or √x) or raw carets (like x^2). Always use LaTeX.

Respond ONLY with valid JSON:
{
  "title": "${title}",
  "description": "Comprehensive mock exam for ${subject.name}",
  "durationMinutes": ${Math.ceil(numQuestions * 1.5)},
  "questions": [
    {
      "text": "Question text...",
      "options": ["A", "B", "C", "D"],
      "correctOption": 0
    }
  ]
}`;

        return this.executeGeneration(prompt, async (data) => {
            return this.prisma.mockExam.create({
                data: {
                    title: data.title,
                    description: data.description,
                    durationMinutes: data.durationMinutes,
                    isApproved,
                    questions: {
                        create: data.questions.map((q: any) => ({
                            text: q.text,
                            options: q.options,
                            correctOption: q.correctOption
                        }))
                    }
                },
                include: { questions: true }
            });
        });
    }

    async generateFullSyllabus(subjectId: string, numTopics: number = 5, userRole?: string) {
        const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject) throw new Error('Subject not found');

        // Step 1: Generate Topics
        const topicPrompt = `Generate exactly ${numTopics} curriculum topics for the subject "${subject.name}".
Respond ONLY with a JSON object:
{
  "topics": ["Topic 1 Name", "Topic 2 Name", ...]
}`;

        const topicData = await this.executeGeneration(topicPrompt, async (data) => data);
        const topicNames = topicData.topics;

        // Step 2: Generate Lessons for each topic
        const results = [];
        for (const topicName of topicNames) {
            try {
                const topicResult = await this.generateLevelsForTopic(subjectId, topicName, 3, userRole);
                results.push(topicResult);
            } catch (err) {
                this.logger.error(`Failed to generate levels for topic ${topicName}: ${err.message}`);
            }
        }

        // Step 3: Generate a Mock Exam for the subject
        try {
            await this.generateMockExam(subjectId, `${subject.name} - Standardized Pro Mock`, 30, userRole);
        } catch (err) {
            this.logger.error(`Failed to generate subject mock exam: ${err.message}`);
        }

        return { subject, topics: results };
    }

    private async executeGeneration(prompt: string, saveCallback: (data: any) => Promise<any>) {
        try {
            const response = await axios.post(
                'https://api.deepseek.com/chat/completions',
                {
                    model: 'deepseek-chat',
                    messages: [
                        { role: 'system', content: 'You are a professional academic JSON generator. You provide deep, accurate, and extensive educational content.' },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: 'json_object' },
                    max_tokens: 8192
                },
                { headers: { 'Authorization': `Bearer ${this.deepseekKey}` } }
            );

            let text = response.data.choices[0].message.content.trim();
            if (text.startsWith('\`\`\`json')) text = text.replace(/^\`\`\`json\s*/, '').replace(/\s*\`\`\`$/, '');
            else if (text.startsWith('\`\`\`')) text = text.replace(/^\`\`\`\s*/, '').replace(/\s*\`\`\`$/, '');

            const data = JSON.parse(text);
            return await saveCallback(data);
        } catch (error) {
            this.logger.error(`AI Generation failed: ${error.message}`, error.stack);
            throw new Error('Failed to generate AI content');
        }
    }
}
