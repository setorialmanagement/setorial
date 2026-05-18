import { PrismaService } from '../prisma.service';
export declare class SupportController {
    private prisma;
    constructor(prisma: PrismaService);
    sendMessage(req: any, data: {
        subject: string;
        message: string;
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
    getMyMessages(req: any): Promise<{
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
    }[]>;
}
