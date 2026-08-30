import { PrismaService } from '../prisma.service';
export declare class PublicController {
    private prisma;
    constructor(prisma: PrismaService);
    getConfig(key: string): Promise<{
        error: string;
        key?: undefined;
        value?: undefined;
    } | {
        key: string;
        value: null;
        error?: undefined;
    } | {
        key: string;
        value: string;
        error?: undefined;
    }>;
}
