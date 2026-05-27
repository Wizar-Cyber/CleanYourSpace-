import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit.entity';
import { AuditService } from './audit.service';
import { LogRetentionService } from './log-retention.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditService, LogRetentionService],
  exports: [AuditService],
})
export class AuditModule {}
