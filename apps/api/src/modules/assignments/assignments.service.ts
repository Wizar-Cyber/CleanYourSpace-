import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Not } from 'typeorm';
import { ServiceAssignment, AssignmentStatus } from './assignment.entity';
import { User } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.entity';
import { CreateAssignmentDto, UpdateAssignmentDto } from '@corecon/types';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(ServiceAssignment)
    private readonly assignmentRepository: Repository<ServiceAssignment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(page = 1, limit = 20, filters?: { status?: string; cleanerId?: string; date?: string }) {
    const query = this.assignmentRepository.createQueryBuilder('a')
      .leftJoinAndSelect('a.service', 'service')
      .leftJoinAndSelect('a.cleaner', 'cleaner')
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('a.createdAt', 'DESC');

    if (filters?.status) {
      query.andWhere('a.status = :status', { status: filters.status });
    }

    if (filters?.cleanerId) {
      query.andWhere('a.cleanerId = :cleanerId', { cleanerId: filters.cleanerId });
    }

    if (filters?.date) {
      query.andWhere('a.scheduledDate = :date', { date: filters.date });
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data: data.map((a) => ({
        ...a,
        serviceName: a.service?.name,
        clientName: a.service?.clientName,
        clientAddress: a.service?.address,
        cleanerName: a.cleaner ? `${a.cleaner.firstName} ${a.cleaner.lastName}` : undefined,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1 },
    };
  }

  async findById(id: string, requestingUser?: { id: string; role: string }) {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ['service', 'cleaner', 'checklistItems', 'photos'],
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (requestingUser && requestingUser.role !== 'super_admin' && requestingUser.role !== 'manager' && assignment.cleanerId !== requestingUser.id) {
      throw new ForbiddenException('You do not have access to this assignment');
    }

    return assignment;
  }

  async findByCleaner(cleanerId: string, status?: string) {
    const where: any = { cleanerId };

    if (status) {
      where.status = status;
    }

    return this.assignmentRepository.find({
      where,
      relations: ['service'],
      order: { scheduledDate: 'DESC' },
    });
  }

  async findTodayByCleaner(cleanerId: string) {
    const today = new Date().toISOString().split('T')[0];

    return this.assignmentRepository.find({
      where: {
        cleanerId,
        scheduledDate: today as any,
      },
      relations: ['service'],
      order: { scheduledStartTime: 'ASC' },
    });
  }

  async create(dto: CreateAssignmentDto) {
    const assignment = this.assignmentRepository.create(dto as any);

    if (dto.cleanerId) {
      const cleaner = await this.userRepository.findOne({ where: { id: dto.cleanerId } });
      if (cleaner?.hourlyRate) {
        (assignment as any).hourlyRateSnapshot = cleaner.hourlyRate;
      }
    }

    const saved = await this.assignmentRepository.save(assignment) as unknown as ServiceAssignment;

    await this.auditService.log({
      userId: dto.cleanerId,
      action: AuditAction.CREATE,
      entityType: 'service_assignment',
      entityId: saved.id,
      newValues: dto as any,
    });

    return saved;
  }

  async update(id: string, dto: UpdateAssignmentDto) {
    const assignment = await this.findById(id);
    const oldValues = { ...assignment } as any;
    const safeDto = { ...dto };
    delete (safeDto as any).hourlyRateSnapshot;
    delete (safeDto as any).paymentCalculated;
    Object.assign(assignment, safeDto);
    const saved = await this.assignmentRepository.save(assignment);

    await this.auditService.log({
      action: AuditAction.UPDATE,
      entityType: 'service_assignment',
      entityId: id,
      oldValues,
      newValues: dto as any,
    });

    return saved;
  }

  async updateStatus(id: string, status: AssignmentStatus, userId: string) {
    const assignment = await this.findById(id);

    if (assignment.cleanerId !== userId && !userId.startsWith('admin') && !userId.startsWith('super')) {
      throw new ForbiddenException('You can only update your own assignments');
    }

    const oldStatus = assignment.status;
    assignment.status = status;

    if (status === AssignmentStatus.IN_PROGRESS) {
      assignment.startedAt = new Date();
      (assignment as any).timerStart = new Date();

      await this.notificationsService.create({
        userId,
        type: NotificationType.SERVICE_STARTED as any,
        title: 'Service Started',
        body: `Service "${assignment.service?.name}" has been started`,
        relatedServiceId: assignment.serviceId,
      });
    }

    if (status === AssignmentStatus.PENDING_VERIFICATION) {
      (assignment as any).timerEnd = new Date();
      if ((assignment as any).timerStart) {
        (assignment as any).totalMinutes = Math.round(
          (new Date().getTime() - new Date((assignment as any).timerStart).getTime()) / 60000,
        );
      }
      if ((assignment as any).hourlyRateSnapshot && (assignment as any).totalMinutes) {
        (assignment as any).paymentCalculated =
          Math.round(((assignment as any).hourlyRateSnapshot / 60) * (assignment as any).totalMinutes * 100) / 100;
      }
    }

    if (status === AssignmentStatus.COMPLETED) {
      assignment.completedAt = new Date();
    }

    const saved = await this.assignmentRepository.save(assignment);

    await this.auditService.log({
      userId,
      action: AuditAction.STATUS_CHANGE,
      entityType: 'service_assignment',
      entityId: id,
      oldValues: { status: oldStatus },
      newValues: { status },
    });

    return saved;
  }

  async startService(id: string, userId: string, latitude?: number, longitude?: number) {
    const assignment = await this.findById(id);

    if (assignment.cleanerId !== userId) {
      throw new ForbiddenException('This assignment is not assigned to you');
    }

    assignment.status = AssignmentStatus.IN_PROGRESS;
    assignment.startedAt = new Date();
    (assignment as any).timerStart = new Date();

    if (latitude) assignment.latitude = latitude;
    if (longitude) assignment.longitude = longitude;

    const saved = await this.assignmentRepository.save(assignment);

    await this.auditService.log({
      userId,
      action: AuditAction.STATUS_CHANGE,
      entityType: 'service_assignment',
      entityId: id,
      newValues: { status: AssignmentStatus.IN_PROGRESS, startedAt: assignment.startedAt },
    });

    await this.notificationsService.create({
      userId,
      type: NotificationType.SERVICE_STARTED as any,
      title: 'Service Started',
      body: `Service "${assignment.service?.name}" has been started`,
      relatedServiceId: assignment.serviceId,
    });

    return saved;
  }

  async completeService(id: string, userId: string) {
    const assignment = await this.findById(id);

    if (assignment.cleanerId !== userId) {
      throw new ForbiddenException('This assignment is not assigned to you');
    }

    assignment.status = AssignmentStatus.PENDING_VERIFICATION;
    (assignment as any).timerEnd = new Date();

    if ((assignment as any).timerStart) {
      (assignment as any).totalMinutes = Math.round(
        (new Date().getTime() - new Date((assignment as any).timerStart).getTime()) / 60000,
      );
    }

    if ((assignment as any).hourlyRateSnapshot && (assignment as any).totalMinutes) {
      (assignment as any).paymentCalculated =
        Math.round(((assignment as any).hourlyRateSnapshot / 60) * (assignment as any).totalMinutes * 100) / 100;
    }

    const saved = await this.assignmentRepository.save(assignment);

    await this.auditService.log({
      userId,
      action: AuditAction.STATUS_CHANGE,
      entityType: 'service_assignment',
      entityId: id,
      newValues: {
        status: AssignmentStatus.PENDING_VERIFICATION,
        totalMinutes: (assignment as any).totalMinutes,
        paymentCalculated: (assignment as any).paymentCalculated,
      },
    });

    if (assignment.service) {
      await this.assignmentRepository.manager
        .getRepository('services')
        .update(assignment.serviceId, { status: 'pending_verification' as any });
    }

    const admins = await this.userRepository.find({ where: { role: 'admin' as any } });
    for (const admin of admins) {
      await this.notificationsService.create({
        userId: admin.id,
        type: NotificationType.SERVICE_PENDING_VERIFICATION as any,
        title: 'Service Pending Verification',
        body: `Service "${assignment.service?.name}" at ${(assignment.service as any)?.address || ''} is awaiting verification`,
        relatedServiceId: assignment.serviceId,
      });
    }

    return saved;
  }

  async startTimer(id: string, userId: string) {
    const assignment = await this.findById(id);

    if (assignment.cleanerId !== userId) {
      throw new ForbiddenException('This assignment is not assigned to you');
    }

    (assignment as any).timerStart = new Date();
    const saved = await this.assignmentRepository.save(assignment);

    await this.auditService.log({
      userId,
      action: AuditAction.TIMER_START,
      entityType: 'service_assignment',
      entityId: id,
      newValues: { timerStart: saved.timerStart },
    });

    return saved;
  }

  async stopTimer(id: string, userId: string) {
    const assignment = await this.findById(id);

    if (assignment.cleanerId !== userId) {
      throw new ForbiddenException('This assignment is not assigned to you');
    }

    (assignment as any).timerEnd = new Date();

    if ((assignment as any).timerStart) {
      (assignment as any).totalMinutes = Math.round(
        (new Date().getTime() - new Date((assignment as any).timerStart).getTime()) / 60000,
      );
    }

    if ((assignment as any).hourlyRateSnapshot && (assignment as any).totalMinutes) {
      (assignment as any).paymentCalculated =
        Math.round(((assignment as any).hourlyRateSnapshot / 60) * (assignment as any).totalMinutes * 100) / 100;
    }

    const saved = await this.assignmentRepository.save(assignment);

    await this.auditService.log({
      userId,
      action: AuditAction.TIMER_STOP,
      entityType: 'service_assignment',
      entityId: id,
      newValues: {
        timerEnd: (assignment as any).timerEnd,
        totalMinutes: (assignment as any).totalMinutes,
        paymentCalculated: (assignment as any).paymentCalculated,
      },
    });

    return saved;
  }

  async findOverlapping(
    staffIds: string[],
    startTime: Date,
    endTime: Date,
    excludeServiceId?: string,
  ) {
    const query = this.assignmentRepository.createQueryBuilder('a')
      .leftJoinAndSelect('a.cleaner', 'cleaner')
      .leftJoinAndSelect('a.service', 'service')
      .where('a.cleanerId IN (:...staffIds)', { staffIds })
      .andWhere('a.status IN (:...statuses)', {
        statuses: ['pending', 'accepted', 'in_progress'],
      })
      .andWhere('a.scheduledDate = :date', {
        date: startTime.toISOString().split('T')[0],
      });

    if (excludeServiceId) {
      query.andWhere('a.serviceId != :excludeServiceId', { excludeServiceId });
    }

    return query.getMany();
  }

  async replaceAssignments(serviceId: string, staffIds: string[]) {
    const existing = await this.assignmentRepository.find({
      where: { serviceId },
    });

    const existingIds = existing.map((a) => a.cleanerId);
    const toRemove = existing.filter((a) => !staffIds.includes(a.cleanerId));
    const toAdd = staffIds.filter((id) => !existingIds.includes(id));

    if (toRemove.length > 0) {
      await this.assignmentRepository.remove(toRemove);
    }

    if (toAdd.length > 0) {
      const service = await this.assignmentRepository.manager
        .getRepository('services')
        .findOne({ where: { id: serviceId } });

      if (service) {
        for (const cleanerId of toAdd) {
          const assignment = this.assignmentRepository.create({
            serviceId,
            cleanerId,
            scheduledDate: (service as any).scheduledAt,
            scheduledStartTime: '09:00',
            scheduledEndTime: '12:00',
            status: 'pending' as any,
          });
          await this.assignmentRepository.save(assignment);
        }
      }
    }
  }

  async getTodaysSummary() {
    const today = new Date().toISOString().split('T')[0];

    const total = await this.assignmentRepository.count({
      where: { scheduledDate: today as any },
    });

    const completed = await this.assignmentRepository.count({
      where: { scheduledDate: today as any, status: AssignmentStatus.COMPLETED },
    });

    const inProgress = await this.assignmentRepository.count({
      where: { scheduledDate: today as any, status: AssignmentStatus.IN_PROGRESS },
    });

    const pendingVerification = await this.assignmentRepository.count({
      where: { scheduledDate: today as any, status: AssignmentStatus.PENDING_VERIFICATION },
    });

    return { total, completed, inProgress, pendingVerification, pending: total - completed - inProgress - pendingVerification };
  }
}
