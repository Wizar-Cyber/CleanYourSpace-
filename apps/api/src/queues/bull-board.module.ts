import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OfflineSyncQueue } from '../modules/sync/sync-queue.entity';
import { Report } from '../modules/reports/report.entity';
import { AssignmentsModule } from '../modules/assignments/assignments.module';
import { ReportsModule } from '../modules/reports/reports.module';
import { SyncProcessor } from './sync.processor';
import { ReportProcessor } from './report.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: parseInt(config.get('REDIS_PORT', '6379'), 10),
          password: config.get('REDIS_PASSWORD', undefined),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'sync' },
      { name: 'reports' },
    ),
    TypeOrmModule.forFeature([OfflineSyncQueue, Report]),
    AssignmentsModule,
    ReportsModule,
  ],
  providers: [SyncProcessor, ReportProcessor],
  exports: [BullModule],
})
export class BullBoardModule {}
