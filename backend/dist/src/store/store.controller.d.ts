import { StoreService } from './store.service';
export declare class StoreController {
    private readonly storeService;
    constructor(storeService: StoreService);
    getStore(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        type: import("@prisma/client").$Enums.PowerUpType;
        price: import("@prisma/client-runtime-utils").Decimal;
        icon: string;
        durationDays: number | null;
    }[]>;
    getMyPowerUps(req: any): Promise<({
        powerUp: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            type: import("@prisma/client").$Enums.PowerUpType;
            price: import("@prisma/client-runtime-utils").Decimal;
            icon: string;
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
