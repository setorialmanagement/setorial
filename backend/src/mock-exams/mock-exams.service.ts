import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { GamificationService } from '../gamification/gamification.service';
import { AiContentService } from '../learning/ai-content.service';

@Injectable()
export class MockExamsService {
    private readonly logger = new Logger(MockExamsService.name);

    constructor(
        private prisma: PrismaService,
        private walletService: WalletService,
        private gamificationService: GamificationService,
        private aiContentService: AiContentService
    ) { }

    async getAvailableMocks(userId: string, role?: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const isPremium = user && (user.tier === 'SILVER' || user.tier === 'GOLD');

        const isStaff = role === 'ADMIN' || role === 'TUTOR';
        const whereClause = isStaff ? {} : { isActive: true, isApproved: true };

        const mocks = await this.prisma.mockExam.findMany({
            where: whereClause,
            select: {
                id: true,
                title: true,
                description: true,
                durationMinutes: true,
                price: true,
                isActive: true,
                isApproved: true,
                _count: { select: { questions: true } },
                ...(isStaff && { questions: true })
            }
        });

        if (!isStaff && isPremium) {
            return mocks.map(m => ({ ...m, price: 0 }));
        }

        return mocks;
    }

    async getMockDetails(mockId: string) {
        return this.prisma.mockExam.findUnique({
            where: { id: mockId },
            include: { questions: { select: { id: true, text: true, options: true } } }
        });
    }

    async startMock(userId: string, mockId: string) {
        const mock = await this.prisma.mockExam.findUnique({ where: { id: mockId } });
        if (!mock) throw new NotFoundException('Mock exam not found');

        // Check for existing active attempt
        const existingAttempt = await this.prisma.mockAttempt.findFirst({
            where: { userId, mockExamId: mockId, status: 'IN_PROGRESS' }
        });

        if (existingAttempt) {
            return { attemptId: existingAttempt.id, resumed: true };
        }

        // Must pay for ticket
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const isPremium = user && (user.tier === 'SILVER' || user.tier === 'GOLD');

        let price = Number(mock.price);
        if (isPremium) {
            price = 0;
        }

        if (price > 0) {
            const hasSufficientBalance = await this.walletService.deductBalance(userId, price, 'Mock Exam Access');
            if (!hasSufficientBalance) {
                throw new BadRequestException('Insufficient wallet balance to purchase this mock exam.');
            }
        }

        const attempt = await this.prisma.mockAttempt.create({
            data: {
                userId,
                mockExamId: mockId,
                status: 'IN_PROGRESS'
            }
        });

        return { attemptId: attempt.id, resumed: false };
    }

    async submitMock(userId: string, attemptId: string, answers: number[], tabSwitches: number) {
        const attempt = await this.prisma.mockAttempt.findUnique({
            where: { id: attemptId },
            include: { mockExam: { include: { questions: true } } }
        });

        if (!attempt) throw new NotFoundException('Attempt not found');
        if (attempt.userId !== userId) throw new ForbiddenException('Not your attempt');
        if (attempt.status !== 'IN_PROGRESS') throw new BadRequestException('Attempt already completed');

        const now = new Date();
        const durationAllowedMs = attempt.mockExam.durationMinutes * 60 * 1000;
        const timeTakenMs = now.getTime() - attempt.startedAt.getTime();

        // 5 minute buffer for network latency and rendering
        const isTimeViolated = timeTakenMs > (durationAllowedMs + (5 * 60 * 1000));

        // Anti-Cheat: Validate time and tab switches
        if (isTimeViolated || tabSwitches > 3) {
            await this.prisma.mockAttempt.update({
                where: { id: attemptId },
                data: { status: 'CHEATED', completedAt: now, score: 0, tabSwitches }
            });
            throw new BadRequestException('Exam flagged for irregular activity. Score nullified.');
        }

        // Calculate Score
        let score = 0;
        const questions = attempt.mockExam.questions;

        questions.forEach((q, index) => {
            if (q.correctOption === answers[index]) {
                score++;
            }
        });

        const updatedAttempt = await this.prisma.mockAttempt.update({
            where: { id: attemptId },
            data: { status: 'COMPLETED', score, completedAt: now, tabSwitches }
        });

        // Award huge points for mocks compared to normal quizzes
        const pointsEarned = score * 50;
        if (pointsEarned > 0) {
            await this.gamificationService.awardPoints(userId, pointsEarned, 'Mock Exam Completion');
        }

        const corrections = questions.map((q, index) => ({
            text: q.text,
            options: q.options,
            userOption: answers[index],
            correctOption: q.correctOption,
            explanation: q.explanation,
        }));

        return { score, maxScore: questions.length, pointsEarned, status: updatedAttempt.status, corrections };
    }

    async generateCustomMock(userId: string, subjectIds: string[], numQuestions: number, durationMinutes: number) {
        if (!subjectIds || subjectIds.length === 0) {
            throw new BadRequestException('At least one subject must be selected');
        }

        const parsedNumQuestions = Number(numQuestions);
        const validNumQuestions = (isNaN(parsedNumQuestions) || parsedNumQuestions <= 0) ? 50 : parsedNumQuestions;
        
        const parsedDuration = Number(durationMinutes);
        const validDuration = (isNaN(parsedDuration) || parsedDuration <= 0) ? Math.ceil(validNumQuestions * 1.5) : parsedDuration;

        const questionsPerSubject = Math.floor(validNumQuestions / subjectIds.length);
        let allQuestions: any[] = [];
        let missingQuestionsBySubject: { subjectName: string, missingCount: number }[] = [];

        for (const subjectId of subjectIds) {
            const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
            if (!subject) continue;

            const dbQuestions = await this.prisma.question.findMany({
                where: {
                    lesson: {
                        topic: {
                            subjectId: subject.id
                        }
                    }
                },
                select: {
                    text: true,
                    options: true,
                    correctOption: true,
                    explanation: true
                }
            });

            const shuffledDb = dbQuestions.sort(() => 0.5 - Math.random());
            const selectedDb = shuffledDb.slice(0, questionsPerSubject);
            allQuestions = allQuestions.concat(selectedDb);

            const missing = questionsPerSubject - selectedDb.length;
            if (missing > 0) {
                missingQuestionsBySubject.push({ subjectName: subject.name, missingCount: missing });
            }
        }

        for (const missingData of missingQuestionsBySubject) {
            try {
                this.logger.log(`Generating ${missingData.missingCount} missing questions via AI for ${missingData.subjectName}`);
                const aiQuestions = await this.aiContentService.generateQuestionsForSubject(missingData.subjectName, missingData.missingCount);
                allQuestions = allQuestions.concat(aiQuestions);
            } catch (err) {
                this.logger.error(`Failed to generate AI questions for ${missingData.subjectName}`, err);
            }
        }

        const finalQuestions = allQuestions.sort(() => 0.5 - Math.random());
        const exactQuestions = finalQuestions.slice(0, validNumQuestions);

        const customMock = await this.prisma.mockExam.create({
            data: {
                title: `Custom Mock Exam`,
                description: `A custom mock exam generated on the fly for your subjects.`,
                durationMinutes: validDuration,
                isApproved: false,
                isActive: true,
                price: 0,
                questions: {
                    create: exactQuestions.map((q: any) => ({
                        text: q.text,
                        options: q.options,
                        correctOption: q.correctOption,
                        explanation: q.explanation || null
                    }))
                }
            }
        });

        return {
            mockId: customMock.id,
            message: 'Custom mock generated successfully',
            totalQuestions: exactQuestions.length
        };
    }
}
