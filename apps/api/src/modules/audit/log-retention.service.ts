import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { AuditLog } from './audit.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LogRetentionService {
  private readonly logger = new Logger(LogRetentionService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeOldAuditLogs() {
    const retentionDays = this.configService.get<number>('AUDIT_LOG_RETENTION_DAYS', 90);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    try {
      const result = await this.auditRepository.delete({
        createdAt: LessThan(cutoff),
      });
      if (result.affected && result.affected > 0) {
        this.logger.log(`Purged ${result.affected} audit log entries older than ${retentionDays} days`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Audit log purge failed: ${message}`);
    }
  }
}
