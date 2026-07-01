"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MockExamsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockExamsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const wallet_service_1 = require("../wallet/wallet.service");
const gamification_service_1 = require("../gamification/gamification.service");
const ai_content_service_1 = require("../learning/ai-content.service");
let MockExamsService = MockExamsService_1 = class MockExamsService {
    prisma;
    walletService;
    gamificationService;
    aiContentService;
    logger = new common_1.Logger(MockExamsService_1.name);
    constructor(prisma, walletService, gamificationService, aiContentService) {
        this.prisma = prisma;
        this.walletService = walletService;
        this.gamificationService = gamificationService;
        this.aiContentService = aiContentService;
    }
    async getAvailableMocks(userId, role) {
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
    async getMockDetails(mockId) {
        return this.prisma.mockExam.findUnique({
            where: { id: mockId },
            include: { questions: { select: { id: true, text: true, options: true } } }
        });
    }
    async startMock(userId, mockId) {
        const mock = await this.prisma.mockExam.findUnique({ where: { id: mockId } });
        if (!mock)
            throw new common_1.NotFoundException('Mock exam not found');
        const existingAttempt = await this.prisma.mockAttempt.findFirst({
            where: { userId, mockExamId: mockId, status: 'IN_PROGRESS' }
        });
        if (existingAttempt) {
            return { attemptId: existingAttempt.id, resumed: true };
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const isPremium = user && (user.tier === 'SILVER' || user.tier === 'GOLD');
        let price = Number(mock.price);
        if (isPremium) {
            price = 0;
        }
        if (price > 0) {
            const hasSufficientBalance = await this.walletService.deductBalance(userId, price, 'Mock Exam Access');
            if (!hasSufficientBalance) {
                throw new common_1.BadRequestException('Insufficient wallet balance to purchase this mock exam.');
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
    async submitMock(userId, attemptId, answers, tabSwitches) {
        const attempt = await this.prisma.mockAttempt.findUnique({
            where: { id: attemptId },
            include: { mockExam: { include: { questions: true } } }
        });
        if (!attempt)
            throw new common_1.NotFoundException('Attempt not found');
        if (attempt.userId !== userId)
            throw new common_1.ForbiddenException('Not your attempt');
        if (attempt.status !== 'IN_PROGRESS')
            throw new common_1.BadRequestException('Attempt already completed');
        const now = new Date();
        const durationAllowedMs = attempt.mockExam.durationMinutes * 60 * 1000;
        const timeTakenMs = now.getTime() - attempt.startedAt.getTime();
        const isTimeViolated = timeTakenMs > (durationAllowedMs + (5 * 60 * 1000));
        if (isTimeViolated || tabSwitches > 3) {
            await this.prisma.mockAttempt.update({
                where: { id: attemptId },
                data: { status: 'CHEATED', completedAt: now, score: 0, tabSwitches }
            });
            throw new common_1.BadRequestException('Exam flagged for irregular activity. Score nullified.');
        }
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
    async generateCustomMock(userId, subjectIds, numQuestions, durationMinutes) {
        if (!subjectIds || subjectIds.length === 0) {
            throw new common_1.BadRequestException('At least one subject must be selected');
        }
        const questionsPerSubject = Math.floor(numQuestions / subjectIds.length);
        let allQuestions = [];
        let missingQuestionsBySubject = [];
        for (const subjectId of subjectIds) {
            const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
            if (!subject)
                continue;
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
            }
            catch (err) {
                this.logger.error(`Failed to generate AI questions for ${missingData.subjectName}`, err);
            }
        }
        const finalQuestions = allQuestions.sort(() => 0.5 - Math.random());
        const exactQuestions = finalQuestions.slice(0, numQuestions);
        const customMock = await this.prisma.mockExam.create({
            data: {
                title: `Custom Mock Exam`,
                description: `A custom mock exam generated on the fly for your subjects.`,
                durationMinutes: durationMinutes || Math.ceil(numQuestions * 1.5),
                isApproved: false,
                isActive: true,
                price: 0,
                questions: {
                    create: exactQuestions.map((q) => ({
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
};
exports.MockExamsService = MockExamsService;
exports.MockExamsService = MockExamsService = MockExamsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        wallet_service_1.WalletService,
        gamification_service_1.GamificationService,
        ai_content_service_1.AiContentService])
], MockExamsService);
//# sourceMappingURL=mock-exams.service.js.map