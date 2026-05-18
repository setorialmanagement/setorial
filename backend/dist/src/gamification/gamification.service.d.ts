import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class GamificationService implements OnModuleDestroy, OnModuleInit {
    private prisma;
    private notificationsService;
    private redis;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    awardPoints(userId: string, points: number, action: string, subjectId?: string): Promise<void>;
    incrementStreak(userId: string): Promise<number>;
    applyStreakFreeze(userId: string): Promise<void>;
    getStreak(userId: string): Promise<number>;
    getStarterBadges(): Promise<void>;
    checkAndAwardBadges(userId: string, context: {
        streak: number;
        score?: number;
        total?: number;
    }): Promise<void>;
    getUserBadges(userId: string): Promise<{
        awardedAt: Date;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        icon: string;
        color: string;
    }[]>;
    getLeaderboard(limit?: number, subjectId?: string): Promise<{
        id: string;
        points: any;
        name: string;
        avatarUrl: string | null;
    }[]>;
}
