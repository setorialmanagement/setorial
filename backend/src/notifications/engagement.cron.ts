import { Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EngagementCronService {
    private readonly logger = new Logger(EngagementCronService.name);

    constructor(
        private readonly prisma: PrismaService,
        @Optional() @InjectQueue('engagement-push') private readonly engagementQueue?: Queue
    ) {}

    // Runs every day at 17:00 server time (5:00 PM)
    @Cron('0 17 * * *')
    async scheduleEngagementPushes() {
        this.logger.log('Starting daily engagement push scheduling...');

        // Fetch users who have an expo push token
        const users = await this.prisma.user.findMany({
            where: { expoPushToken: { not: null } },
            select: { id: true }
        });

        if (!this.engagementQueue) {
            this.logger.warn('Bull queues are disabled; skipping engagement push scheduling.');
            return;
        }

        if (users.length === 0) {
            this.logger.log('No users with push tokens found.');
            return;
        }

        // Shuffled times between 5pm and 8pm (up to 3 hours delay)
        // 3 hours = 3 * 60 * 60 * 1000 = 10800000 ms
        const maxDelayMs = 3 * 60 * 60 * 1000; 

        let queuedCount = 0;

        for (const user of users) {
            const randomDelay = Math.floor(Math.random() * maxDelayMs);
            
            await this.engagementQueue.add(
                'send-engagement', 
                { userId: user.id },
                { delay: randomDelay }
            );
            queuedCount++;
        }

        this.logger.log(`Scheduled ${queuedCount} engagement pushes between 5 PM and 8 PM.`);
    }
}
