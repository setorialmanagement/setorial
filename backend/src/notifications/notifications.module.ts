import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma.service';

@Global()
@Module({
    imports: [
        HttpModule,
    ],
    providers: [NotificationsService, PrismaService],
    exports: [NotificationsService],
})
export class NotificationsModule { }
