import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { PushSubscription } from './push-subscription.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PushService } from './push.service';
import { ReminderService } from './reminder.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { MailModule } from '../mail/mail.module';
import { ServiceAssignment } from '../assignments/assignment.entity';
import { Service } from '../services/service.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, PushSubscription, ServiceAssignment, Service]),
    RealtimeModule,
    MailModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, PushService, ReminderService],
  exports: [NotificationsService, PushService],
})
export class NotificationsModule {}
