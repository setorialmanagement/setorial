import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PayoutsModule } from '../payouts/payouts.module';
import { PrismaModule } from '../prisma.module';
import { MockExamsModule } from '../mock-exams/mock-exams.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PayoutsModule, PrismaModule, MockExamsModule, NotificationsModule, UsersModule],
  controllers: [AdminController],
})
export class AdminModule { }
