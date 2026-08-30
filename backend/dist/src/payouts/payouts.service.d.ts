import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Queue } from 'bullmq';
export declare class PayoutsService {
    private prisma;
    private notificationsService;
    private payoutsQueue?;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, payoutsQueue?: Queue | undefined);
    simulatePayout(month: string, globalEstimatedRevenue?: number): Promise<{
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
    processPayout(month: string): Promise<{
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
    handleMonthlyPayout(): Promise<void>;
    disburseFunds(userId: string, amount: number, region: string): Promise<any>;
}
