import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistTemplate } from './checklist-template.entity';
import { ChecklistTemplateItem } from './checklist-template-item.entity';
import { ServiceChecklistItem } from './checklist-item.entity';
import { ServiceAssignment } from '../assignments/assignment.entity';
import { ChecklistService } from './checklist.service';
import { ChecklistController } from './checklist.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChecklistTemplate, ChecklistTemplateItem, ServiceChecklistItem, ServiceAssignment]),
  ],
  controllers: [ChecklistController],
  providers: [ChecklistService],
  exports: [ChecklistService],
})
export class ChecklistModule {}
