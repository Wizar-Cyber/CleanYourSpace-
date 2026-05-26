import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { ServiceAssignment } from '../assignments/assignment.entity';
import { TimeRecord } from '../time-tracking/time-record.entity';
import { Incident } from '../incidents/incident.entity';
import { LocationAlert } from '../location/location-alert.entity';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceAssignment, TimeRecord, Incident, LocationAlert]),
    RealtimeModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}