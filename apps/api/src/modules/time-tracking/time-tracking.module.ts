import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeRecord } from './time-record.entity';
import { TimeTrackingService } from './time-tracking.service';
import { TimeTrackingController } from './time-tracking.controller';
import { ServiceAssignment } from '../assignments/assignment.entity';
import { Service } from '../services/service.entity';
import { User } from '../users/user.entity';
import { LocationLog } from '../location/location-log.entity';
import { LocationAlert } from '../location/location-alert.entity';
import { LocationModule } from '../location/location.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TimeRecord, ServiceAssignment, Service, User, LocationLog, LocationAlert]),
    LocationModule,
    NotificationsModule,
    RealtimeModule,
  ],
  controllers: [TimeTrackingController],
  providers: [TimeTrackingService],
  exports: [TimeTrackingService],
})
export class TimeTrackingModule {}
