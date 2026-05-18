import { PayoutsService } from '../payouts/payouts.service';
import { PrismaService } from '../prisma.service';
import { MockExamsService } from '../mock-exams/mock-exams.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class AdminController {
    private payoutsService;
    private prisma;
    private mockExamsService;
    private notificationsService;
    constructor(payoutsService: PayoutsService, prisma: PrismaService, mockExamsService: MockExamsService, notificationsService: NotificationsService);
    getDashboardStats(): Promise<{
        currentMonthRevenue: number;
        rewardPoolCap: number;
        totalLiability: number;
        liabilityRatio: number;
        projectedPayoutExposure: number;
        distributionRatio: number;
        dynamicConversionRate: number;
        riskLevel: string;
        sustainabilityTier: string;
        activeMonetizedUsers: number;
        fraudFlags: {
            suspiciousHighEarners: number;
            cheatedMockAttempts: number;
            flaggedUserIds: string[];
        };
        pendingKycCount: number;
        approvedKycCount: number;
        totalUsers: number;
        latestPayoutBatch: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            region: string | null;
            status: import("@prisma/client").$Enums.PayoutStatus;
            exchangeRate: number | null;
            month: string;
            totalLiability: import("@prisma/client-runtime-utils").Decimal;
            totalPaid: import("@prisma/client-runtime-utils").Decimal;
        } | null;
    }>;
    getPendingKyc(): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        email: string;
        tier: import("@prisma/client").$Enums.Tier;
        payoutMethod: import("@prisma/client").$Enums.PayoutMethod | null;
        payoutAccount: import("@prisma/client/runtime/client").JsonValue;
    }[]>;
    approveKyc(userId: string): Promise<{
        id: string;
        name: string | null;
        email: string;
        isVerified: boolean;
        kycStatus: import("@prisma/client").$Enums.KycStatus;
    }>;
    rejectKyc(userId: string, reason: string): Promise<{
        success: boolean;
        userId: string;
        reason: string;
    }>;
    getAllUsers(tier?: string, kycStatus?: string, role?: string): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        email: string;
        role: import("@prisma/client").$Enums.Role;
        tier: import("@prisma/client").$Enums.Tier;
        isVerified: boolean;
        kycStatus: import("@prisma/client").$Enums.KycStatus;
        isFrozen: boolean;
        isFlagged: boolean;
    }[]>;
    createTutor(data: any): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        email: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
    freezeUser(userId: string, isFrozen: boolean): Promise<{
        id: string;
        email: string;
        isFrozen: boolean;
    }>;
    flagUser(userId: string, isFlagged: boolean): Promise<{
        id: string;
        email: string;
        isFlagged: boolean;
    }>;
    getConfigs(): Promise<{
        id: string;
        updatedAt: Date;
        description: string | null;
        key: string;
        value: string;
    }[]>;
    updateConfig(key: string, value: string, description?: string): Promise<{
        id: string;
        updatedAt: Date;
        description: string | null;
        key: string;
        value: string;
    }>;
    getDiscounts(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        code: string;
        discountPercent: number;
        maxUses: number | null;
        usedCount: number;
        expiryDate: Date | null;
    }[]>;
    createDiscount(data: {
        code: string;
        discountPercent: number;
        maxUses?: number;
        expiryDate?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        code: string;
        discountPercent: number;
        maxUses: number | null;
        usedCount: number;
        expiryDate: Date | null;
    }>;
    toggleDiscount(id: string, isActive: boolean): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        code: string;
        discountPercent: number;
        maxUses: number | null;
        usedCount: number;
        expiryDate: Date | null;
    }>;
    getPayoutBatches(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        region: string | null;
        status: import("@prisma/client").$Enums.PayoutStatus;
        exchangeRate: number | null;
        month: string;
        totalLiability: import("@prisma/client-runtime-utils").Decimal;
        totalPaid: import("@prisma/client-runtime-utils").Decimal;
    }[]>;
    triggerPayout(month: string): Promise<{
        message: string;
        month: string;
        totalPaid: number;
        totalGlobalPaid?: undefined;
        regionsProcessed?: undefined;
        batches?: undefined;
    } | {
        month: string;
        totalGlobalPaid: number;
        regionsProcessed: number;
        batches: {
            region: any;
            batchId: any;
            rewardPool: number;
            totalEligibleBalance: any;
            distributionRatio: number;
            totalPaid: number;
            usersPaid: any;
        }[];
        message?: undefined;
        totalPaid?: undefined;
    }>;
    simulatePayout(month: string, revenue?: string): Promise<{
        month: string;
        globalEstimatedRevenue: number | undefined;
        regions: {
            region: any;
            regionalRevenue: number;
            rewardPool: number;
            totalEligibleBalance: any;
            distributionRatio: number;
            safeToExecute: boolean;
            simulatedPayoutsCount: any;
            simulatedPayouts: any;
        }[];
    }>;
    createMock(data: any, req: any): Promise<{
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
    } & {
        id: string;
        isApproved: boolean;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        price: import("@prisma/client-runtime-utils").Decimal;
        title: string;
        durationMinutes: number;
    }>;
    legacyUpdateMock(id: string, data: any, req: any): Promise<{
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
    } & {
        id: string;
        isApproved: boolean;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        price: import("@prisma/client-runtime-utils").Decimal;
        title: string;
        durationMinutes: number;
    }>;
    getMock(id: string): Promise<({
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
    } & {
        id: string;
        isApproved: boolean;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        price: import("@prisma/client-runtime-utils").Decimal;
        title: string;
        durationMinutes: number;
    }) | null>;
    deleteMock(id: string): Promise<{
        id: string;
        isApproved: boolean;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        price: import("@prisma/client-runtime-utils").Decimal;
        title: string;
        durationMinutes: number;
    }>;
    patchMock(id: string, data: any, req: any): Promise<{
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
    } & {
        id: string;
        isApproved: boolean;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        price: import("@prisma/client-runtime-utils").Decimal;
        title: string;
        durationMinutes: number;
    }>;
    approveMock(id: string): Promise<{
        id: string;
        isApproved: boolean;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        description: string | null;
        price: import("@prisma/client-runtime-utils").Decimal;
        title: string;
        durationMinutes: number;
    }>;
    getSupportMessages(): Promise<({
        user: {
            name: string | null;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string;
        userId: string;
        status: import("@prisma/client").$Enums.SupportStatus;
        message: string;
        adminReply: string | null;
        repliedAt: Date | null;
        repliedBy: string | null;
    })[]>;
    replyToSupport(id: string, data: {
        reply: string;
        adminName: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string;
        userId: string;
        status: import("@prisma/client").$Enums.SupportStatus;
        message: string;
        adminReply: string | null;
        repliedAt: Date | null;
        repliedBy: string | null;
    }>;
    sendNotification(data: {
        userId?: string;
        title: string;
        body: string;
        data?: any;
    }): Promise<void>;
    sendEmailBroadcast(data: {
        subject: string;
        body: string;
    }): Promise<void>;
}
