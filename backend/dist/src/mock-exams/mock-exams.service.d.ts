import { PrismaService } from '../prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { GamificationService } from '../gamification/gamification.service';
import { AiContentService } from '../learning/ai-content.service';
export declare class MockExamsService {
    private prisma;
    private walletService;
    private gamificationService;
    private aiContentService;
    private readonly logger;
    constructor(prisma: PrismaService, walletService: WalletService, gamificationService: GamificationService, aiContentService: AiContentService);
    getAvailableMocks(userId: string, role?: string): Promise<{
        id: string;
        isApproved: boolean;
        description: string | null;
        _count: {
            questions: number;
        };
        isActive: boolean;
        questions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            mockExamId: string | null;
            lessonId: string | null;
            options: import("@prisma/client/runtime/client").JsonValue;
            text: string;
            correctOption: number;
            explanation: string | null;
        }[];
        price: import("@prisma/client-runtime-utils").Decimal;
        title: string;
        durationMinutes: number;
    }[] | {
        price: number;
        id: string;
        isApproved: boolean;
        description: string | null;
        _count: {
            questions: number;
        };
        isActive: boolean;
        questions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            mockExamId: string | null;
            lessonId: string | null;
            options: import("@prisma/client/runtime/client").JsonValue;
            text: string;
            correctOption: number;
            explanation: string | null;
        }[];
        title: string;
        durationMinutes: number;
    }[]>;
    getMockDetails(mockId: string): Promise<({
        questions: {
            id: string;
            options: import("@prisma/client/runtime/client").JsonValue;
            text: string;
        }[];
    } & {
        id: string;
        isApproved: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        isActive: boolean;
        price: import("@prisma/client-runtime-utils").Decimal;
        title: string;
        durationMinutes: number;
    }) | null>;
    startMock(userId: string, mockId: string): Promise<{
        attemptId: string;
        resumed: boolean;
    }>;
    submitMock(userId: string, attemptId: string, answers: number[], tabSwitches: number): Promise<{
        score: number;
        maxScore: number;
        pointsEarned: number;
        status: import("@prisma/client").$Enums.MockStatus;
        corrections: {
            text: string;
            options: import("@prisma/client/runtime/client").JsonValue;
            userOption: number;
            correctOption: number;
            explanation: string | null;
        }[];
    }>;
    generateCustomMock(userId: string, subjectIds: string[], numQuestions: number, durationMinutes: number): Promise<{
        mockId: string;
        message: string;
        totalQuestions: number;
    }>;
}
