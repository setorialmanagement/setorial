import { StoreService } from './store.service';
export declare class StoreController {
    private readonly storeService;
    constructor(storeService: StoreService);
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
    getMyPowerUps(req: any): Promise<({
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
    initializePurchase(req: any, type: string): Promise<{
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
}
