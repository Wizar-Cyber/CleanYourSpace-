import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './service.entity';
import { ServiceType } from './service-type.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { AssignmentsModule } from '../assignments/assignments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, ServiceType]),
    NotificationsModule,
    AssignmentsModule,
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
