import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './report.entity';
import { ServiceAssignment } from '../assignments/assignment.entity';
import { User } from '../users/user.entity';
import { TimeRecord } from '../time-tracking/time-record.entity';
import { Incident } from '../incidents/incident.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, ServiceAssignment, User, TimeRecord, Incident]),
    BullModule.registerQueue({ name: 'reports' }),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
