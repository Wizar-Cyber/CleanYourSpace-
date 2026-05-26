import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { Service, ServiceStatus } from './service.entity';
import { ServiceType } from './service-type.entity';
import {
  CreateServiceDto, UpdateServiceDto, CancelServiceDto,
  ServiceHistoryQueryDto, CalendarQueryDto, CreateServiceTypeDto,
} from '@corecon/types';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { AssignmentsService } from '../assignments/assignments.service';
import { UserRole } from '../users/user.entity';

const NON_CRITICAL_FIELDS = ['specialInstructions', 'accessInstructions'];

const VALID_TRANSITIONS: Record<ServiceStatus, ServiceStatus[]> = {
  [ServiceStatus.SCHEDULED]: [ServiceStatus.IN_PROGRESS, ServiceStatus.CANCELLED],
  [ServiceStatus.IN_PROGRESS]: [ServiceStatus.COMPLETED, ServiceStatus.NEEDS_REVIEW, ServiceStatus.CANCELLED],
  [ServiceStatus.COMPLETED]: [],
  [ServiceStatus.NEEDS_REVIEW]: [ServiceStatus.COMPLETED, ServiceStatus.IN_PROGRESS],
  [ServiceStatus.CANCELLED]: [],
};

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(ServiceType)
    private readonly serviceTypeRepository: Repository<ServiceType>,
    private readonly notificationsService: NotificationsService,
    private readonly assignmentsService: AssignmentsService,
  ) {}

  async findAll(page = 1, limit = 20) {
    const [data, total] = await this.serviceRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { scheduledAt: 'DESC' },
      relations: ['assignments', 'assignments.cleaner', 'parentService'],
    });

    return {
      data: data.map((s) => this.formatServiceResponse(s)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async findById(id: string) {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['assignments', 'assignments.cleaner', 'parentService'],
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return this.formatServiceResponse(service);
  }

  async create(dto: CreateServiceDto, userId?: string) {
    if (dto.assignedStaffIds?.length) {
      await this.validateNoOverlap(
        dto.assignedStaffIds,
        new Date(dto.scheduledAt),
        dto.estimatedMinutes,
      );
    }

    const service = this.serviceRepository.create({
      clientName: dto.clientName,
      clientEmail: dto.clientEmail || null,
      clientPhone: dto.clientPhone || null,
      address: dto.address,
      latitude: dto.latitude || null,
      longitude: dto.longitude || null,
      accessInstructions: dto.accessInstructions || null,
      serviceType: dto.serviceType,
      customServiceType: dto.customServiceType || null,
      status: ServiceStatus.SCHEDULED,
      scheduledAt: new Date(dto.scheduledAt),
      estimatedMinutes: dto.estimatedMinutes,
      specialInstructions: dto.specialInstructions || null,
      checklistTemplateId: dto.checklistTemplateId || null,
      recurrenceRule: dto.recurrenceRule || null,
      recurrenceEndDate: dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : null,
    } as any);

    const saved = await this.serviceRepository.save(service);

    if (dto.assignedStaffIds?.length) {
      for (const cleanerId of dto.assignedStaffIds) {
        await this.assignmentsService.create({
          serviceId: saved.id,
          cleanerId,
          scheduledDate: dto.scheduledAt,
          scheduledStartTime: this.formatTime(new Date(dto.scheduledAt)),
          scheduledEndTime: this.formatEndTime(new Date(dto.scheduledAt), dto.estimatedMinutes),
        });
      }
    }

    if (dto.recurrenceRule && dto.recurrenceEndDate) {
      await this.generateRecurringInstances(saved, dto);
    }

    return this.findById(saved.id);
  }

  async update(id: string, dto: UpdateServiceDto, userRole?: string) {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['assignments'],
    });

    if (!service) throw new NotFoundException('Service not found');

    if (service.status === ServiceStatus.COMPLETED) {
      if (userRole !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Only SUPER_ADMIN can edit a completed service');
      }
    }

    if (service.status === ServiceStatus.IN_PROGRESS) {
      const nonCriticalKeys = Object.keys(dto).filter(
        (k) => !NON_CRITICAL_FIELDS.includes(k as any),
      );
      if (nonCriticalKeys.length > 0) {
        throw new ForbiddenException(
          `Cannot modify ${nonCriticalKeys.join(', ')} while service is in progress`,
        );
      }
    }

    if (service.status === ServiceStatus.CANCELLED) {
      throw new ForbiddenException('Cannot modify a cancelled service');
    }

    if (dto.assignedStaffIds) {
      await this.validateNoOverlap(
        dto.assignedStaffIds,
        new Date(dto.scheduledAt || service.scheduledAt),
        dto.estimatedMinutes || service.estimatedMinutes,
        id,
      );
    }

    const updateData: any = {};
    if (dto.clientName !== undefined) updateData.clientName = dto.clientName;
    if (dto.clientEmail !== undefined) updateData.clientEmail = dto.clientEmail;
    if (dto.clientPhone !== undefined) updateData.clientPhone = dto.clientPhone;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.latitude !== undefined) updateData.latitude = dto.latitude;
    if (dto.longitude !== undefined) updateData.longitude = dto.longitude;
    if (dto.accessInstructions !== undefined) updateData.accessInstructions = dto.accessInstructions;
    if (dto.serviceType !== undefined) updateData.serviceType = dto.serviceType;
    if (dto.customServiceType !== undefined) updateData.customServiceType = dto.customServiceType;
    if (dto.scheduledAt !== undefined) updateData.scheduledAt = new Date(dto.scheduledAt);
    if (dto.estimatedMinutes !== undefined) updateData.estimatedMinutes = dto.estimatedMinutes;
    if (dto.specialInstructions !== undefined) updateData.specialInstructions = dto.specialInstructions;
    if (dto.checklistTemplateId !== undefined) updateData.checklistTemplateId = dto.checklistTemplateId;
    if (dto.recurrenceRule !== undefined) updateData.recurrenceRule = dto.recurrenceRule;
    if (dto.recurrenceEndDate !== undefined) updateData.recurrenceEndDate = dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : null;

    Object.assign(service, updateData);
    const saved = await this.serviceRepository.save(service);

    if (dto.assignedStaffIds) {
      await this.assignmentsService.replaceAssignments(id, dto.assignedStaffIds);
    }

    return this.findById(saved.id);
  }

  async updateStatus(id: string, newStatus: ServiceStatus, userId?: string, reason?: string) {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['assignments'],
    });

    if (!service) throw new NotFoundException('Service not found');

    const allowed = VALID_TRANSITIONS[service.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${service.status} to ${newStatus}`,
      );
    }

    const updateData: any = { status: newStatus };

    if (newStatus === ServiceStatus.IN_PROGRESS) {
      updateData.startedAt = new Date();
    }

    if (newStatus === ServiceStatus.CANCELLED) {
      if (!reason) {
        throw new BadRequestException('Cancellation reason is required');
      }
      updateData.cancellationReason = reason;
      updateData.cancelledAt = new Date();
      updateData.cancelledBy = userId;
    }

    if (newStatus === ServiceStatus.NEEDS_REVIEW) {
      updateData.needsReviewReason = reason || 'Submitted for review';
    }

    Object.assign(service, updateData);
    const saved = await this.serviceRepository.save(service);

    if (newStatus === ServiceStatus.CANCELLED) {
      await this.notifyContractors(service, 'Service Cancelled', `Service has been cancelled: ${reason}`, NotificationType.SERVICE_CANCELLED as any);
    }

    if (newStatus === ServiceStatus.NEEDS_REVIEW) {
      const admins = await this.serviceRepository.manager
        .getRepository('users')
        .find({ where: { role: In([UserRole.SUPER_ADMIN, UserRole.MANAGER]) } });

      for (const admin of admins as any[]) {
        await this.notificationsService.create({
          userId: admin.id,
          type: NotificationType.SERVICE_NEEDS_REVIEW as any,
          title: 'Service Needs Review',
          body: `Service at ${saved.address} ${reason ? `: ${reason}` : 'requires review'}`,
          relatedServiceId: saved.id,
        });
      }
    }

    return this.findById(saved.id);
  }

  async cancelService(id: string, dto: CancelServiceDto, userId: string) {
    return this.updateStatus(id, ServiceStatus.CANCELLED, userId, dto.reason);
  }

  async reschedule(id: string, newScheduledAt: Date) {
    const service = await this.findById(id) as any;

    if (service.status === ServiceStatus.COMPLETED || service.status === ServiceStatus.CANCELLED) {
      throw new ForbiddenException('Cannot reschedule a completed or cancelled service');
    }

    await this.serviceRepository.update(id, { scheduledAt: newScheduledAt });
    return this.findById(id);
  }

  async getServiceTypes() {
    return this.serviceTypeRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async createServiceType(dto: CreateServiceTypeDto) {
    const existing = await this.serviceTypeRepository.findOne({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Service type with this name already exists');
    }

    const type = this.serviceTypeRepository.create({
      name: dto.name,
      category: dto.category || null,
      isCustom: true,
    } as any);

    return this.serviceTypeRepository.save(type);
  }

  async getHistory(query: ServiceHistoryQueryDto) {
    const where: any = {};

    if (query.clientName) {
      where.clientName = query.clientName;
    }
    if (query.contractorId) {
      where.assignments = { cleanerId: query.contractorId };
    }
    if (query.serviceType) {
      where.serviceType = query.serviceType;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.dateFrom || query.dateTo) {
      where.scheduledAt = {};
      if (query.dateFrom) where.scheduledAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.scheduledAt.lte = new Date(query.dateTo);
    }

    const [data, total] = await this.serviceRepository.findAndCount({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      order: { scheduledAt: 'DESC' },
      relations: ['assignments', 'assignments.cleaner'],
    });

    return {
      data: data.map((s) => this.formatServiceResponse(s)),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getCalendar(query: CalendarQueryDto) {
    const startDate = new Date(query.dateFrom);
    const endDate = new Date(query.dateTo);

    const services = await this.serviceRepository.find({
      where: {
        scheduledAt: Between(startDate, endDate),
        status: In([ServiceStatus.SCHEDULED, ServiceStatus.IN_PROGRESS]),
      },
      order: { scheduledAt: 'ASC' },
      relations: ['assignments', 'assignments.cleaner'],
    });

    return services.map((s) => this.formatServiceResponse(s));
  }

  private async generateRecurringInstances(original: Service, dto: CreateServiceDto) {
    if (!dto.recurrenceRule || !dto.recurrenceEndDate) return;

    const startDate = new Date(dto.scheduledAt);
    const endDate = new Date(dto.recurrenceEndDate);
    const instances: Partial<Service>[] = [];
    let current = new Date(startDate);
    let instanceCount = 0;

    while (current <= endDate) {
      instanceCount++;
      const nextDate = this.getNextRecurrenceDate(current, dto.recurrenceRule);
      if (!nextDate || nextDate > endDate) break;

      instances.push({
        clientName: original.clientName,
        clientEmail: original.clientEmail,
        clientPhone: original.clientPhone,
        address: original.address,
        latitude: original.latitude,
        longitude: original.longitude,
        accessInstructions: original.accessInstructions,
        serviceType: original.serviceType,
        customServiceType: original.customServiceType,
        status: ServiceStatus.SCHEDULED,
        scheduledAt: nextDate,
        estimatedMinutes: original.estimatedMinutes,
        specialInstructions: original.specialInstructions,
        checklistTemplateId: original.checklistTemplateId,
        parentServiceId: original.id,
        recurrenceRule: original.recurrenceRule,
        recurrenceEndDate: original.recurrenceEndDate,
        recurrenceInstance: instanceCount,
      } as any);

      current = nextDate;
    }

    if (instances.length > 0) {
      await this.serviceRepository.save(instances as any[]);
    }
  }

  private getNextRecurrenceDate(current: Date, rule: string): Date | null {
    const next = new Date(current);
    switch (rule) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        return next;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        return next;
      case 'biweekly':
        next.setDate(next.getDate() + 14);
        return next;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        return next;
      default:
        return null;
    }
  }

  async validateNoOverlap(
    staffIds: string[],
    scheduledAt: Date,
    estimatedMinutes: number,
    excludeServiceId?: string,
  ) {
    const scheduledEnd = new Date(scheduledAt.getTime() + estimatedMinutes * 60000);

    const whereClause: any = {
      cleanerId: In(staffIds),
      status: In(['pending', 'accepted', 'in_progress']),
    };

    if (excludeServiceId) {
      whereClause.serviceId = In(
        (await this.serviceRepository.find({
          where: { id: excludeServiceId },
          select: ['id'],
        })).map((s) => s.id),
      );
    }

    const overlappingAssignments = await this.assignmentsService.findOverlapping(
      staffIds,
      scheduledAt,
      scheduledEnd,
      excludeServiceId,
    );

    if (overlappingAssignments.length > 0) {
      const names = overlappingAssignments.map((a: any) => a.cleaner?.firstName || a.cleanerId);
      throw new BadRequestException(
        `Staff members ${names.join(', ')} have overlapping assignments at this time`,
      );
    }
  }

  private async notifyContractors(
    service: Service,
    title: string,
    body: string,
    type: NotificationType,
  ) {
    for (const assignment of service.assignments || []) {
      await this.notificationsService.create({
        userId: assignment.cleanerId,
        type: type as any,
        title,
        body,
        relatedServiceId: service.id,
      });
    }
  }

  async findByStatus(status: ServiceStatus) {
    return this.serviceRepository.find({
      where: { status },
      order: { scheduledAt: 'ASC' },
      relations: ['assignments', 'assignments.cleaner'],
    });
  }

  async remove(id: string) {
    const service = await this.findById(id) as any;
    if (service.status === ServiceStatus.IN_PROGRESS) {
      throw new ForbiddenException('Cannot delete a service in progress');
    }
    await this.serviceRepository.delete(id);
    return { message: 'Service deleted' };
  }

  async getTodaySummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const total = await this.serviceRepository.count({
      where: { scheduledAt: Between(today, tomorrow) as any },
    });

    const completed = await this.serviceRepository.count({
      where: { status: ServiceStatus.COMPLETED, scheduledAt: Between(today, tomorrow) as any },
    });

    const inProgress = await this.serviceRepository.count({
      where: { status: ServiceStatus.IN_PROGRESS },
    });

    const needsReview = await this.serviceRepository.count({
      where: { status: ServiceStatus.NEEDS_REVIEW },
    });

    return { total, completed, inProgress, needsReview, scheduled: total - completed - inProgress };
  }

  private formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5);
  }

  private formatEndTime(date: Date, minutes: number): string {
    const end = new Date(date.getTime() + minutes * 60000);
    return end.toTimeString().slice(0, 5);
  }

  private formatServiceResponse(service: Service) {
    const cleaned: any = { ...service };
    if (cleaned.assignments) {
      cleaned.assignedStaff = cleaned.assignments.map((a: any) => ({
        id: a.id,
        cleanerId: a.cleanerId,
        cleanerName: a.cleaner
          ? `${a.cleaner.firstName} ${a.cleaner.lastName}`
          : null,
        status: a.status,
        scheduledDate: a.scheduledDate,
        scheduledStartTime: a.scheduledStartTime,
        scheduledEndTime: a.scheduledEndTime,
      }));
      cleaned.assignedStaffIds = cleaned.assignedStaff.map((a: any) => a.cleanerId);
    }
    return cleaned;
  }
}
