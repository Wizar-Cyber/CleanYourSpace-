import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChecklistTemplate } from './checklist-template.entity';
import { ChecklistTemplateItem } from './checklist-template-item.entity';
import { ServiceChecklistItem, ChecklistItemStatus } from './checklist-item.entity';
import { ServiceAssignment, AssignmentStatus } from '../assignments/assignment.entity';
import { CreateChecklistTemplateDto, UpdateChecklistItemDto } from '@corecon/types';

@Injectable()
export class ChecklistService {
  constructor(
    @InjectRepository(ChecklistTemplate)
    private readonly templateRepository: Repository<ChecklistTemplate>,
    @InjectRepository(ChecklistTemplateItem)
    private readonly templateItemRepository: Repository<ChecklistTemplateItem>,
    @InjectRepository(ServiceChecklistItem)
    private readonly checklistItemRepository: Repository<ServiceChecklistItem>,
    @InjectRepository(ServiceAssignment)
    private readonly assignmentRepository: Repository<ServiceAssignment>,
  ) {}

  async createTemplate(dto: CreateChecklistTemplateDto) {
    const template = this.templateRepository.create({
      name: dto.name,
      description: dto.description || null,
    } as ChecklistTemplate);
    const saved = await this.templateRepository.save(template);
    if (dto.items?.length) {
      const items: ChecklistTemplateItem[] = dto.items.map((item) =>
        this.templateItemRepository.create({
          templateId: saved.id,
          label: item.label,
          order: item.order,
          required: item.required,
          requiresPhoto: item.requiresPhoto ?? false,
          maxPhotos: item.maxPhotos ?? 5,
          category: item.category || null,
        } as ChecklistTemplateItem),
      );
      await this.templateItemRepository.save(items);
    }
    return this.templateRepository.findOne({ where: { id: saved.id }, relations: ['items'] });
  }

  async createTemplateItem(templateId: string, dto: { label: string; order: number; required: boolean; requiresPhoto?: boolean; maxPhotos?: number; category?: string }) {
    const template = await this.templateRepository.findOne({ where: { id: templateId } });
    if (!template) throw new NotFoundException('Template not found');
    const item = this.templateItemRepository.create({
      templateId, label: dto.label, order: dto.order,
      required: dto.required, requiresPhoto: dto.requiresPhoto ?? false,
      maxPhotos: dto.maxPhotos ?? 5, category: dto.category || null,
    } as ChecklistTemplateItem);
    return this.templateItemRepository.save(item);
  }

  async getTemplates() {
    return this.templateRepository.find({
      where: { isActive: true }, relations: ['items'], order: { createdAt: 'DESC' },
    });
  }

  async initChecklistForAssignment(assignmentId: string, templateId: string) {
    const items = await this.templateItemRepository.find({
      where: { templateId }, order: { order: 'ASC' },
    });
    if (!items.length) throw new NotFoundException('Template has no items');
    const checklistItems: ServiceChecklistItem[] = items.map((item) =>
      this.checklistItemRepository.create({
        assignmentId, templateItemId: item.id, status: ChecklistItemStatus.PENDING,
      } as ServiceChecklistItem),
    );
    return this.checklistItemRepository.save(checklistItems);
  }

  async getAssignmentChecklist(assignmentId: string, requestingUser?: { id: string; role: string }) {
    if (requestingUser && requestingUser.role !== 'admin') {
      const assignment = await this.assignmentRepository.findOne({
        where: { id: assignmentId, cleanerId: requestingUser.id },
      });
      if (!assignment) throw new ForbiddenException('You do not have access to this checklist');
    }
    return this.checklistItemRepository.find({
      where: { assignmentId },
      relations: ['templateItem'],
      order: { templateItem: { order: 'ASC' } },
    });
  }

  async updateItem(id: string, dto: UpdateChecklistItemDto, userId: string, requestingUser?: { id: string; role: string }) {
    const item = await this.checklistItemRepository.findOne({
      where: { id }, relations: ['templateItem'],
    });
    if (!item) throw new NotFoundException('Checklist item not found');

    if (requestingUser && requestingUser.role !== 'admin') {
      const assignment = await this.assignmentRepository.findOne({
        where: { id: item.assignmentId, cleanerId: requestingUser.id },
      });
      if (!assignment) throw new ForbiddenException('You do not have access to this checklist item');
    }

    const templateItem = item.templateItem;
    if (templateItem?.requiresPhoto && !dto.photoId) {
      throw new BadRequestException('This item requires a photo. Please attach a photo before completing.');
    }

    if (dto.status !== ChecklistItemStatus.PENDING && dto.status !== ChecklistItemStatus.FAILED) {
      item.completedAt = new Date();
    }

    item.status = dto.status as ChecklistItemStatus;
    (item as any).notes = dto.notes || null;
    item.completedBy = userId;
    if (dto.photoId) item.photoId = dto.photoId;

    return this.checklistItemRepository.save(item);
  }

  async validateChecklistBeforeClockOut(assignmentId: string) {
    const items = await this.checklistItemRepository.find({
      where: { assignmentId, status: ChecklistItemStatus.PENDING },
      relations: ['templateItem'],
    });
    const requiredPending = items.filter((i) => {
      const templateItem = i.templateItem;
      return templateItem?.required && i.status === ChecklistItemStatus.PENDING;
    });
    return {
      canProceed: requiredPending.length === 0,
      pendingRequired: requiredPending.map((i) => ({
        id: i.id, label: (i.templateItem as any)?.label || 'Unknown',
        requiresPhoto: (i.templateItem as any)?.requiresPhoto || false,
      })),
    };
  }

  async approvalAction(assignmentId: string, action: 'approve' | 'return' | 'needs_review', notes?: string) {
    const assignment = await this.assignmentRepository.findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    switch (action) {
      case 'approve':
        assignment.status = AssignmentStatus.COMPLETED;
        break;
      case 'return':
        assignment.status = AssignmentStatus.RETURNED;
        (assignment as any).notes = notes || 'Returned for revision';
        break;
      case 'needs_review':
        (assignment as any).status = 'needs_review';
        (assignment as any).needsReviewReason = notes || 'Marked for review';
        break;
    }
    return this.assignmentRepository.save(assignment);
  }
}