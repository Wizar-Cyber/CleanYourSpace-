import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { ServiceAssignment } from '../assignments/assignment.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from '@corecon/types';
import { NotificationType } from '../notifications/notification.entity';
import { UserRole } from './user.entity';

@Injectable()
export class UsersService {
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(query: UserQueryDto) {
    const { page, limit, role, isActive, contractType, search } = query;
    const where: any = {};

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (contractType) where.contractType = contractType;
    if (search) {
      where.andWhere = [
        { firstName: Like(`%${search}%`) },
        { lastName: Like(`%${search}%`) },
        { email: Like(`%${search}%`) },
      ];
    }

    const [data, total] = await this.userRepository.findAndCount({
      where: where.andWhere ? undefined : where,
      ...(where.andWhere ? { where: where.andWhere } : {}),
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: data.map(({ passwordHash, refreshToken, ...rest }) => rest),
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
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, refreshToken, ...rest } = user;
    return rest;
  }

  async findCleaners() {
    const cleaners = await this.userRepository.find({
      where: [
        { role: UserRole.CONTRACTOR, isActive: true },
        { role: UserRole.SUPERVISOR as any, isActive: true },
      ],
      order: { firstName: 'ASC' },
    });

    return cleaners.map(({ passwordHash, refreshToken, ...rest }) => rest);
  }

  async create(dto: CreateUserDto, createdBy: string) {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone || null,
      role: dto.role,
      isActive: dto.isActive ?? true,
      language: dto.language || 'en',
      hourlyRate: dto.hourlyRate || null,
      contractType: dto.contractType || null,
      mustChangePassword: dto.role === UserRole.CONTRACTOR || dto.role === UserRole.SUPERVISOR,
      createdBy,
    } as any);

    const saved = await this.userRepository.save(user) as unknown as User;

    await this.auditService.log({
      userId: createdBy,
      action: AuditAction.CREATE,
      entityType: 'user',
      entityId: saved.id,
      newValues: { email: saved.email, role: saved.role, contractType: saved.contractType },
    });

    const { passwordHash: _, refreshToken, ...rest } = saved;
    return rest;
  }

  async update(id: string, dto: UpdateUserDto, currentUserId?: string, currentUserRole?: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (currentUserRole === UserRole.CONTRACTOR) {
      const allowedFields = ['firstName', 'lastName', 'phone', 'language'];
      const restrictedFields = Object.keys(dto).filter((k) => !allowedFields.includes(k));
      if (restrictedFields.length > 0) {
        throw new ForbiddenException('Contractors can only update basic profile fields');
      }
    }

    Object.assign(user, dto);
    await this.userRepository.save(user);

    await this.auditService.log({
      userId: currentUserId || user.id,
      action: AuditAction.UPDATE,
      entityType: 'user',
      entityId: user.id,
      oldValues: { email: user.email },
      newValues: { ...dto },
    });

    const { passwordHash, refreshToken, ...rest } = user;
    return rest;
  }

  async deactivate(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const activeStatuses = ['pending', 'accepted', 'in_progress', 'pending_verification', 'returned'];
    const activeAssignments = await this.userRepository.manager.find(ServiceAssignment, {
      where: { cleanerId: id, status: In(activeStatuses) },
      take: 1,
    });

    if (activeAssignments.length > 0) {
      await this.notificationsService.create({
        userId: id,
        type: NotificationType.CLEANER_DEACTIVATED_WITH_ACTIVE_SERVICE as any,
        title: 'Account deactivated with active services',
        body: 'Your account has been deactivated but you have active service assignments. Please contact your manager.',
        relatedServiceId: activeAssignments[0].serviceId,
      });
    }

    user.isActive = false;
    await this.userRepository.save(user);

    await this.auditService.log({
      userId: id,
      action: AuditAction.DELETE,
      entityType: 'user',
      entityId: id,
      oldValues: { isActive: true },
      newValues: { isActive: false },
    });

    return { message: 'User deactivated', hadActiveServices: activeAssignments.length > 0 };
  }

  async findContractorProfile(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['documents'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const assignments = await this.userRepository.manager.find(ServiceAssignment, {
      where: { cleanerId: id },
      relations: ['service'],
      order: { scheduledDate: 'DESC' },
    });

    const totalHours = assignments.reduce((sum, a) => sum + (a.totalMinutes || 0), 0) / 60;
    const completedServices = assignments.filter((a) => a.status === 'completed').length;
    const totalServices = assignments.length;
    const completionRate = totalServices > 0 ? (completedServices / totalServices) * 100 : 0;

    const { passwordHash, refreshToken, ...rest } = user;
    return {
      ...rest,
      stats: {
        totalHours: Math.round(totalHours * 100) / 100,
        completedServices,
        totalServices,
        completionRate: Math.round(completionRate * 100) / 100,
      },
      recentAssignments: assignments.slice(0, 10).map((a) => ({
        id: a.id,
        status: a.status,
        serviceName: a.service?.name || null,
        scheduledDate: a.scheduledDate,
        totalMinutes: a.totalMinutes,
        paymentCalculated: a.paymentCalculated,
        completedAt: a.completedAt,
      })),
    };
  }

  async getStats() {
    const total = await this.userRepository.count();
    const active = await this.userRepository.count({ where: { isActive: true } });
    const contractors = await this.userRepository.count({
      where: { role: UserRole.CONTRACTOR as any, isActive: true },
    });
    const admins = await this.userRepository.count({
      where: [
        { role: UserRole.SUPER_ADMIN as any, isActive: true },
        { role: UserRole.MANAGER as any, isActive: true },
      ],
    });
    const w2 = await this.userRepository.count({
      where: { contractType: 'w2' as any, isActive: true },
    });
    const contractor1099 = await this.userRepository.count({
      where: { contractType: 'contractor_1099' as any, isActive: true },
    });

    return { total, active, contractors, admins, w2, contractor1099 };
  }
}
