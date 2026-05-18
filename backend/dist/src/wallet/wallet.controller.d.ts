import { WalletService } from './wallet.service';
export declare class WalletController {
    private walletService;
    constructor(walletService: WalletService);
    getBalance(req: any): Promise<{
        balance: number;
        exchangeRate: number;
    }>;
    getTransactions(req: any): Promise<{
        id: string;
        createdAt: Date;
        region: string | null;
        userId: string;
        type: import("@prisma/client").$Enums.WalletTxType;
        amount: import("@prisma/client-runtime-utils").Decimal;
        reference: string | null;
        exchangeRate: number | null;
    }[]>;
}
