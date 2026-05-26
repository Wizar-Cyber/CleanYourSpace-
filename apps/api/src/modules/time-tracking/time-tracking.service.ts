import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Between } from 'typeorm';
import { TimeRecord, TimeRecordType, TimeApprovalStatus } from './time-record.entity';
import { ServiceAssignment } from '../assignments/assignment.entity';
import { User } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';
import { LocationService } from '../location/location.service';
import { ClockInDto, ClockOutDto, ApproveTimeDto, TimeHistoryQuery, HourReportQuery, InconsistencyType } from '@corecon/types';
import { UserRole } from '../users/user.entity';

@Injectable()
export class TimeTrackingService {
  constructor(
    @InjectRepository(TimeRecord)
    private readonly timeRecordRepository: Repository<TimeRecord>,
    @InjectRepository(ServiceAssignment)
    private readonly assignmentRepository: Repository<ServiceAssignment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly locationService: LocationService,
  ) {}

  async clockIn(dto: ClockInDto, userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId, isActive: true } });
    if (!user) throw new NotFoundException('User not found');

    const assignment = await this.assignmentRepository.findOne({
      where: { id: dto.assignmentId },
      relations: ['service'],
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.cleanerId !== userId) throw new ForbiddenException('Not your assignment');

    const serviceAddress = (assignment as any).service?.address || '';
    const expectedLat = (assignment as any).service?.latitude || dto.latitude;
    const expectedLon = (assignment as any).service?.longitude || dto.longitude;

    const proximity = await this.locationService.validateProximity(
      userId, dto.assignmentId, dto.latitude, dto.longitude, expectedLat, expectedLon,
    );

    const record = this.timeRecordRepository.create({
      assignmentId: dto.assignmentId,
      userId,
      type: TimeRecordType.CLOCK_IN,
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracy: dto.accuracy || null,
      timestamp: new Date(),
      isWithinRadius: proximity.valid,
      geofenceRadius: 200,
      distanceFromService: proximity.distance,
      isSynced: true,
    } as any);

    const saved = await this.timeRecordRepository.save(record);

    assignment.status = 'in_progress' as any;
    (assignment as any).timerStart = new Date();
    assignment.startedAt = new Date();
    (assignment as any).latitude = dto.latitude;
    (assignment as any).longitude = dto.longitude;
    await this.assignmentRepository.save(assignment);

    await this.auditService.log({
      userId, action: AuditAction.TIMER_START, entityType: 'time_record',
      entityId: saved.id, newValues: { type: TimeRecordType.CLOCK_IN, latitude: dto.latitude, longitude: dto.longitude },
    });

    await this.notificationsService.create({
      userId, type: NotificationType.SERVICE_STARTED as any, title: 'Clock-in registered',
      body: `Clock-in at ${new Date().toLocaleTimeString()}`, relatedServiceId: dto.assignmentId,
    });

    return { record: saved, assignment, proximity };
  }

  async clockOut(dto: ClockOutDto, userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId, isActive: true } });
    if (!user) throw new NotFoundException('User not found');

    const assignment = await this.assignmentRepository.findOne({ where: { id: dto.assignmentId }, relations: ['service'] });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.cleanerId !== userId) throw new ForbiddenException('Not your assignment');

    if (!assignment.timerStart) throw new NotFoundException('No active timer found');

    const totalMinutes = Math.round((Date.now() - new Date(assignment.timerStart).getTime()) / 60000);

    const serviceAddress = (assignment as any).service?.address || '';
    const expectedLat = (assignment as any).service?.latitude || dto.latitude;
    const expectedLon = (assignment as any).service?.longitude || dto.longitude;

    const proximity = await this.locationService.validateProximity(
      userId, dto.assignmentId, dto.latitude, dto.longitude, expectedLat, expectedLon,
    );

    const record = this.timeRecordRepository.create({
      assignmentId: dto.assignmentId,
      userId,
      type: TimeRecordType.CLOCK_OUT,
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracy: dto.accuracy || null,
      timestamp: new Date(),
      isWithinRadius: proximity.valid,
      geofenceRadius: 200,
      distanceFromService: proximity.distance,
      isSynced: true,
    } as any);

    const saved = await this.timeRecordRepository.save(record);

    (assignment as any).timerEnd = new Date();
    (assignment as any).totalMinutes = totalMinutes;
    assignment.status = 'pending_verification' as any;

    if ((assignment as any).hourlyRateSnapshot && totalMinutes) {
      (assignment as any).paymentCalculated =
        Math.round(((assignment as any).hourlyRateSnapshot / 60) * totalMinutes * 100) / 100;
    }

    await this.assignmentRepository.save(assignment);

    await this.auditService.log({
      userId, action: AuditAction.TIMER_STOP, entityType: 'time_record',
      entityId: saved.id, newValues: { type: TimeRecordType.CLOCK_OUT, totalMinutes, latitude: dto.latitude, longitude: dto.longitude },
    });

    await this.notificationsService.create({
      userId, type: NotificationType.SERVICE_PENDING_VERIFICATION as any, title: 'Clock-out registered',
      body: `Total: ${totalMinutes} min`, relatedServiceId: dto.assignmentId,
    });

    return { record: saved, assignment, totalMinutes, proximity };
  }

  async getTimer(assignmentId: string, userId?: string) {
    const assignment = await this.assignmentRepository.findOne({ where: { id: assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    if (!assignment.timerStart) return { active: false, elapsed: 0 };

    const elapsed = Math.round((Date.now() - new Date(assignment.timerStart).getTime()) / 60000);

    return {
      active: !assignment.timerEnd,
      startedAt: assignment.timerStart,
      elapsedMinutes: elapsed,
      elapsedHours: Math.round(elapsed / 60 * 100) / 100,
      totalMinutes: assignment.totalMinutes,
      paymentCalculated: assignment.paymentCalculated,
    };
  }

  async getHistory(query: TimeHistoryQuery) {
    const where: any = {};
    if (query.cleanerId) where.userId = query.cleanerId;
    if (query.from && query.to) {
      where.timestamp = Between(new Date(query.from), new Date(query.to));
    }

    const [data, total] = await this.timeRecordRepository.findAndCount({
      where,
      relations: ['assignment'],
      order: { timestamp: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      data: data.map(r => ({
        ...r,
        assignment: r.assignment ? {
          id: r.assignment.id,
          clientName: (r.assignment as any).service?.clientName || '',
          serviceName: (r.assignment as any).service?.name || '',
          status: r.assignment.status,
        } : undefined,
      })),
      meta: { total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async getReport(query: HourReportQuery) {
    const where: any = {};
    if (query.cleanerId) where.userId = query.cleanerId;

    let from: Date, to: Date;
    const now = new Date();
    switch (query.period) {
      case 'day': from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); to = now; break;
      case 'week': from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); to = now; break;
      case 'month': from = new Date(now.getFullYear(), now.getMonth(), 1); to = now; break;
      case 'custom': from = query.from ? new Date(query.from) : new Date(0); to = query.to ? new Date(query.to) : now; break;
      default: from = new Date(0); to = now;
    }

    where.timestamp = Between(from, to);

    const records = await this.timeRecordRepository.find({
      where, relations: ['assignment'], order: { timestamp: 'DESC' },
    });

    const totalMinutes = records.reduce((s, r) => {
      if (r.type === TimeRecordType.CLOCK_OUT && r.assignment?.totalMinutes) {
        return s + r.assignment.totalMinutes;
      }
      return s;
    }, 0);

    const approvedRecords = records.filter(r => r.approvalStatus === TimeApprovalStatus.APPROVED);
    const pendingRecords = records.filter(r => r.approvalStatus === TimeApprovalStatus.PENDING);

    const approvedMinutes = approvedRecords.reduce((s, r) => {
      if (r.type === TimeRecordType.CLOCK_OUT && r.assignment?.totalMinutes) return s + r.assignment.totalMinutes;
      return s;
    }, 0);

    return {
      totalHours: Math.round(totalMinutes / 60 * 100) / 100,
      approvedHours: Math.round(approvedMinutes / 60 * 100) / 100,
      pendingHours: Math.round(pendingRecords.reduce((s, r) => {
        if (r.type === TimeRecordType.CLOCK_OUT && r.assignment?.totalMinutes) return s + r.assignment.totalMinutes;
        return s;
      }, 0) / 60 * 100) / 100,
      totalEarnings: Math.round(approvedMinutes * ((query.cleanerId ? await this.userRepository.findOne({ where: { id: query.cleanerId } }) : null)?.hourlyRate || 0) / 60 * 100) / 100,
      records,
      period: { from: from.toISOString(), to: to.toISOString() },
    };
  }

  async approveTime(recordId: string, dto: ApproveTimeDto, approvedBy: string) {
    const record = await this.timeRecordRepository.findOne({ where: { id: recordId } });
    if (!record) throw new NotFoundException('Time record not found');

    if (dto.approved) {
      record.approvalStatus = TimeApprovalStatus.APPROVED;
    } else {
      record.approvalStatus = TimeApprovalStatus.REJECTED;
    }

    record.approvedBy = approvedBy;
    record.approvedAt = new Date();

    if (dto.adjustedMinutes) {
      record.adjustedMinutes = dto.adjustedMinutes;
      record.adjustmentReason = dto.adjustmentReason || null;
      record.approvalStatus = TimeApprovalStatus.ADJUSTED;
    }

    const saved = await this.timeRecordRepository.save(record);

    await this.auditService.log({
      userId: approvedBy, action: AuditAction.UPDATE, entityType: 'time_record',
      entityId: recordId, newValues: { approvalStatus: saved.approvalStatus },
    });

    return saved;
  }

  async getInconsistencies(recordId: string) {
    const record = await this.timeRecordRepository.findOne({ where: { id: recordId }, relations: ['assignment'] });
    if (!record) throw new NotFoundException('Time record not found');

    const issues: string[] = [];

    if (!record.isWithinRadius) {
      issues.push(InconsistencyType.GPS_OUTSIDE_AREA);
    }

    if (record.type === TimeRecordType.CLOCK_OUT && record.assignment) {
      const totalMin = record.assignment.totalMinutes || 0;
      const service = await this.assignmentRepository.findOne({
        where: { id: record.assignmentId }, relations: ['service'],
      });
      const expectedDuration = (service as any)?.service?.durationMinutes || 60;
      if (totalMin > expectedDuration * 1.5) issues.push(InconsistencyType.EXCESSIVE_TIME);
      if (totalMin < expectedDuration * 0.5) issues.push(InconsistencyType.INSUFFICIENT_TIME);
    }

    const overlapping = await this.timeRecordRepository.find({
      where: {
        userId: record.userId,
        type: TimeRecordType.CLOCK_IN,
        timestamp: MoreThan(new Date(record.timestamp.getTime() - 60000)),
      },
    });
    if (overlapping.length > 1) issues.push(InconsistencyType.OVERLAPPING_SESSION);

    record.inconsistencies = issues;
    await this.timeRecordRepository.save(record);

    return { id: record.id, inconsistencies: issues };
  }

  async logPeriodicLocation(
    userId: string, assignmentId: string, lat: number, lng: number, accuracy?: number,
  ) {
    const record = this.timeRecordRepository.create({
      assignmentId,
      userId,
      type: TimeRecordType.PERIODIC_LOG,
      latitude: lat,
      longitude: lng,
      accuracy: accuracy || null,
      timestamp: new Date(),
      isSynced: true,
    } as any);

    return this.timeRecordRepository.save(record);
  }
}