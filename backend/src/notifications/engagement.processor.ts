import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from './notifications.service';
import { Logger } from '@nestjs/common';

@Processor('engagement-push')
export class EngagementProcessor extends WorkerHost {
    private readonly logger = new Logger(EngagementProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService
    ) {
        super();
    }

    async process(job: Job<{ userId: string }>): Promise<void> {
        const { userId } = job.data;

        // Get the user's progress today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const progressToday = await this.prisma.userProgress.findFirst({
            where: {
                userId,
                completedAt: { gte: startOfDay }
            }
        });

        const mockToday = await this.prisma.mockAttempt.findFirst({
            where: {
                userId,
                startedAt: { gte: startOfDay }
            }
        });

        const hasStudied = !!progressToday || !!mockToday;

        let title = '';
        let body = '';

        if (hasStudied) {
            const positiveMessages = [
                { t: "Bravo! 🎉", b: "I'm proud of you for studying today! Keep the streak alive!" },
                { t: "Great job today! ⭐", b: "You're one step closer to your goals. See you tomorrow!" },
                { t: "Awesome work! 🔥", b: "You smashed it today. Consistency is key!" }
            ];
            const msg = positiveMessages[Math.floor(Math.random() * positiveMessages.length)];
            title = msg.t;
            body = msg.b;
        } else {
            const negativeMessages = [
                { t: "Are you seriously going to leave me today? 😢", b: "There is still time to study! Come on!" },
                { t: "Don't break your streak! ⏳", b: "Just 5 minutes of study is better than zero. Let's go!" },
                { t: "We miss you! 🥺", b: "You haven't practiced today. Your exams are waiting!" },
                { t: "Time is ticking! ⏰", b: "Don't let today slip by without a quick study session." }
            ];
            const msg = negativeMessages[Math.floor(Math.random() * negativeMessages.length)];
            title = msg.t;
            body = msg.b;
        }

        await this.notificationsService.sendPush(userId, title, body, { type: 'engagement' });
        this.logger.debug(`Sent engagement push to user ${userId} - studied: ${hasStudied}`);
    }
}
