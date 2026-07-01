import { PrismaService } from '../prisma.service';
import { Queue } from 'bullmq';
export declare class EngagementCronService {
    private readonly prisma;
    private readonly engagementQueue;
    private readonly logger;
    constructor(prisma: PrismaService, engagementQueue: Queue);
    scheduleEngagementPushes(): Promise<void>;
}
