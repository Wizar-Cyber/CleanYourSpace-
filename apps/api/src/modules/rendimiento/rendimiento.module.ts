import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { ServiceAssignment } from '../assignments/assignment.entity';
import { Service } from '../services/service.entity';
import { Incident } from '../incidents/incident.entity';
import { ServiceChecklistItem } from '../checklist/checklist-item.entity';
import { SupervisorEvaluation } from './evaluation.entity';
import { PerformanceScore } from './performance-score.entity';
import { RendimientoService } from './rendimiento.service';
import { RendimientoController } from './rendimiento.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ServiceAssignment,
      Service,
      Incident,
      ServiceChecklistItem,
      SupervisorEvaluation,
      PerformanceScore,
    ]),
    AuditModule,
  ],
  controllers: [RendimientoController],
  providers: [RendimientoService],
  exports: [RendimientoService],
})
export class RendimientoModule {}
