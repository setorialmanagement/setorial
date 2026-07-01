import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma.service';
import { BullModule } from '@nestjs/bullmq';
import { EngagementCronService } from './engagement.cron';
import { EngagementProcessor } from './engagement.processor';

@Global()
@Module({
    imports: [
        HttpModule,
        BullModule.registerQueue({
            name: 'engagement-push',
        }),
    ],
    providers: [
        NotificationsService, 
        PrismaService, 
        EngagementCronService, 
        EngagementProcessor
    ],
    exports: [NotificationsService],
})
export class NotificationsModule { }
