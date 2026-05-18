import { PrismaService } from '../prisma.service';
import { WalletTxType } from '@prisma/client';
export declare class WalletService {
    private prisma;
    constructor(prisma: PrismaService);
    getBalanceData(userId: string): Promise<{
        balance: number;
        exchangeRate: number;
    }>;
    addTransaction(userId: string, type: WalletTxType, amount: number, reference?: string): Promise<{
        id: string;
        createdAt: Date;
        region: string | null;
        userId: string;
        type: import("@prisma/client").$Enums.WalletTxType;
        amount: import("@prisma/client-runtime-utils").Decimal;
        reference: string | null;
        exchangeRate: number | null;
    }>;
    getTransactions(userId: string): Promise<{
        id: string;
        createdAt: Date;
        region: string | null;
        userId: string;
        type: import("@prisma/client").$Enums.WalletTxType;
        amount: import("@prisma/client-runtime-utils").Decimal;
        reference: string | null;
        exchangeRate: number | null;
    }[]>;
    deductBalance(userId: string, amount: number, reference: string): Promise<boolean>;
}
