import { PrismaService } from '../prisma.service';
import { GamificationService } from '../gamification/gamification.service';
export declare class StoreService {
    private prisma;
    private gamification;
    constructor(prisma: PrismaService, gamification: GamificationService);
    seedPowerUps(): Promise<void>;
    getStore(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        type: import("@prisma/client").$Enums.PowerUpType;
        description: string;
        icon: string;
        price: import("@prisma/client-runtime-utils").Decimal;
        durationDays: number | null;
    }[]>;
    initializePurchase(userId: string, powerUpType: string): Promise<{
        authorization_url: any;
        access_code: any;
        reference: any;
    }>;
    verifyPurchase(reference: string): Promise<{
        status: string;
        message: string;
        powerUpType?: undefined;
    } | {
        status: string;
        powerUpType: any;
        message?: undefined;
    }>;
    getMyPowerUps(userId: string): Promise<({
        powerUp: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            type: import("@prisma/client").$Enums.PowerUpType;
            description: string;
            icon: string;
            price: import("@prisma/client-runtime-utils").Decimal;
            durationDays: number | null;
        };
    } & {
        id: string;
        userId: string;
        isActive: boolean;
        activatedAt: Date;
        expiresAt: Date | null;
        powerUpId: string;
    })[]>;
    hasActiveBoost(userId: string): Promise<boolean>;
}
