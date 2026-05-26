import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './audit.entity';
import { AsyncContextService } from '../../common/logger/async-context.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
    @Optional() private readonly asyncContext?: AsyncContextService,
  ) {}

  async log(params: {
    userId?: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      const ipAddress = params.ipAddress || this.asyncContext?.get('ipAddress') || null;
      const userAgent = params.userAgent || this.asyncContext?.get('userAgent') || null;

      await this.auditRepository.insert({
        userId: params.userId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        oldValues: (params.oldValues || null) as any,
        newValues: (params.newValues || null) as any,
        ipAddress,
        userAgent,
      } as any);
    } catch (err: any) {
      this.logger.warn(`Audit log failed: ${err.message}`);
    }
  }
}
