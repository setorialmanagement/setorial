import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from './notifications.service';
export declare class EngagementProcessor extends WorkerHost {
    private readonly prisma;
    private readonly notificationsService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    process(job: Job<{
        userId: string;
    }>): Promise<void>;
}
