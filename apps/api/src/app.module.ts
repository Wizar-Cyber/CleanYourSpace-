import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './common/redis/redis.module';
import { HealthModule } from './modules/health/health.module';
import { AuditModule } from './modules/audit/audit.module';
import { MustChangePasswordGuard } from './common/guards/must-change-password.guard';
import { AsyncContextService } from './common/logger/async-context.service';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { UsersModule } from './modules/users/users.module';
import { ServicesModule } from './modules/services/services.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { ChecklistModule } from './modules/checklist/checklist.module';
import { PhotosModule } from './modules/photos/photos.module';
import { LocationModule } from './modules/location/location.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SyncModule } from './modules/sync/sync.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { BullBoardModule } from './queues/bull-board.module';
import { TimeTrackingModule } from './modules/time-tracking/time-tracking.module';
import { IncidentModule } from './modules/incidents/incident.module';
import { RendimientoModule } from './modules/rendimiento/rendimiento.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { MailModule } from './modules/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get('DB_PORT', 5432),
        username: config.get('DB_USER', 'corecon'),
        password: config.get('DB_PASSWORD', 'changeme'),
        database: config.get('DB_NAME', 'corecon'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: false,
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    RedisModule,
    AuthModule,
    UsersModule,
    ServicesModule,
    AssignmentsModule,
    ChecklistModule,
    PhotosModule,
    LocationModule,
    NotificationsModule,
    AuditModule,
    ReportsModule,
    SyncModule,
    RealtimeModule,
    DocumentsModule,
    TimeTrackingModule,
    IncidentModule,
    RendimientoModule,
    DashboardModule,
    InventoryModule,
    MailModule,
    HealthModule,
    ScheduleModule.forRoot(),
    BullBoardModule,
  ],
  providers: [
    AsyncContextService,
    CorrelationIdMiddleware,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: MustChangePasswordGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
