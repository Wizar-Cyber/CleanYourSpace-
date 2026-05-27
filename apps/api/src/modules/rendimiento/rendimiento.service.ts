import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, LessThanOrEqual, MoreThanOrEqual, FindOptionsWhere } from 'typeorm';
import { User } from '../users/user.entity';
import { ServiceAssignment, AssignmentStatus } from '../assignments/assignment.entity';
import { Incident } from '../incidents/incident.entity';
import { ServiceChecklistItem, ChecklistItemStatus } from '../checklist/checklist-item.entity';
import { SupervisorEvaluation } from './evaluation.entity';
import { PerformanceScore, ScorePeriod } from './performance-score.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.entity';
import { CreateEvaluationDto, UpdateEvaluationDto } from '@corecon/types';
import { LATE_THRESHOLD_MINUTES_DEFAULT } from '@corecon/types';

@Injectable()
export class RendimientoService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ServiceAssignment)
    private readonly assignmentRepository: Repository<ServiceAssignment>,
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    @InjectRepository(ServiceChecklistItem)
    private readonly checklistRepository: Repository<ServiceChecklistItem>,
    @InjectRepository(SupervisorEvaluation)
    private readonly evaluationRepository: Repository<SupervisorEvaluation>,
    @InjectRepository(PerformanceScore)
    private readonly scoreRepository: Repository<PerformanceScore>,
    private readonly auditService: AuditService,
  ) {}

  private buildDateFilter(from?: string, to?: string) {
    if (from && to) {
      return Between(new Date(from), new Date(to));
    }
    if (from) {
      return MoreThanOrEqual(new Date(from));
    }
    if (to) {
      return LessThanOrEqual(new Date(to));
    }
    return undefined;
  }

  // ── RF-047: Attendance Metrics ──

  async getAttendanceMetrics(contractorId: string, from?: string, to?: string) {
    const dateFilter = this.buildDateFilter(from, to);
    const where: FindOptionsWhere<ServiceAssignment> = { cleanerId: contractorId };
    if (dateFilter) where.scheduledDate = dateFilter as any;

    const all = await this.assignmentRepository.find({
      where,
      select: ['id', 'status', 'startedAt', 'scheduledDate', 'scheduledStartTime'],
    });

    const totalAssigned = all.length;
    const totalAttended = all.filter((a) =>
      a.status === AssignmentStatus.COMPLETED || a.status === AssignmentStatus.IN_PROGRESS,
    ).length;
    const totalAbsences = all.filter((a) =>
      a.status === AssignmentStatus.CANCELLED || a.status === AssignmentStatus.PENDING,
    ).length;

    const lateThresholdMinutes = LATE_THRESHOLD_MINUTES_DEFAULT;
    const totalLateArrivals = all.filter((a) => {
      if (!a.startedAt || !a.scheduledStartTime) return false;
      const scheduled = this.parseTime(a.scheduledStartTime, a.scheduledDate);
      const actual = new Date(a.startedAt);
      const diffMinutes = (actual.getTime() - scheduled.getTime()) / 60000;
      return diffMinutes > lateThresholdMinutes;
    }).length;

    const attendanceRate = totalAssigned > 0 ? Math.round((totalAttended / totalAssigned) * 10000) / 100 : 0;
    const punctualityRate = totalAttended > 0 ? Math.round(((totalAttended - totalLateArrivals) / totalAttended) * 10000) / 100 : 0;

    return {
      contractorId,
      totalAssigned,
      totalAttended,
      totalAbsences,
      totalLateArrivals,
      attendanceRate,
      punctualityRate,
    };
  }

  // ── RF-048: Punctuality Metrics ──

  async getPunctualityMetrics(contractorId: string, from?: string, to?: string, thresholdMinutes?: number) {
    const dateFilter = this.buildDateFilter(from, to);
    const where: FindOptionsWhere<ServiceAssignment> = { cleanerId: contractorId };
    if (dateFilter) where.scheduledDate = dateFilter as any;

    const assignments = await this.assignmentRepository.find({
      where,
      select: ['id', 'startedAt', 'scheduledDate', 'scheduledStartTime', 'status'],
    });

    const threshold = thresholdMinutes ?? LATE_THRESHOLD_MINUTES_DEFAULT;
    let onTimeCount = 0;
    let lateCount = 0;

    for (const a of assignments) {
      if (!a.startedAt || !a.scheduledStartTime) continue;
      const scheduled = this.parseTime(a.scheduledStartTime, a.scheduledDate);
      const actual = new Date(a.startedAt);
      const diffMinutes = (actual.getTime() - scheduled.getTime()) / 60000;
      if (diffMinutes <= threshold) onTimeCount++;
      else lateCount++;
    }

    const total = onTimeCount + lateCount;
    const punctualityRate = total > 0 ? Math.round((onTimeCount / total) * 10000) / 100 : 0;

    return {
      onTimeCount,
      lateCount,
      lateThresholdMinutes: threshold,
      punctualityRate,
    };
  }

  // ── RF-049: Average Time Per Service Type ──

  async getServiceTimeMetrics(contractorId: string, from?: string, to?: string) {
    const dateFilter = this.buildDateFilter(from, to);
    const where: FindOptionsWhere<ServiceAssignment> = { cleanerId: contractorId, status: AssignmentStatus.COMPLETED };
    if (dateFilter) where.scheduledDate = dateFilter as any;

    const assignments = await this.assignmentRepository.find({
      where,
      relations: ['service'],
    });

    const byType = new Map<string, { totalActual: number; totalEstimated: number; count: number }>();

    for (const a of assignments) {
      if (!a.service || !a.totalMinutes) continue;
      const type = a.service.serviceType;
      const existing = byType.get(type) || { totalActual: 0, totalEstimated: 0, count: 0 };
      existing.totalActual += a.totalMinutes;
      existing.totalEstimated += a.service.estimatedMinutes;
      existing.count++;
      byType.set(type, existing);
    }

    const result = [];
    for (const [serviceType, data] of byType) {
      const avgActual = Math.round(data.totalActual / data.count);
      const avgEstimated = Math.round(data.totalEstimated / data.count);
      const avgVariance = avgActual - avgEstimated;
      const variancePercent = avgEstimated > 0 ? Math.round((avgVariance / avgEstimated) * 10000) / 100 : 0;
      result.push({
        serviceType,
        totalServices: data.count,
        avgActualMinutes: avgActual,
        avgEstimatedMinutes: avgEstimated,
        avgVarianceMinutes: avgVariance,
        variancePercent,
      });
    }

    return result;
  }

  // ── RF-050: Quality Score ──

  async getQualityScore(contractorId: string, from?: string, to?: string) {
    const dateFilter = this.buildDateFilter(from, to);
    const assignmentWhere: FindOptionsWhere<ServiceAssignment> = { cleanerId: contractorId, status: AssignmentStatus.COMPLETED };
    if (dateFilter) assignmentWhere.scheduledDate = dateFilter as any;

    const assignments = await this.assignmentRepository.find({
      where: assignmentWhere,
      relations: ['service'],
    });

    const assignmentIds = assignments.map((a) => a.id);
    let checklistRate = 0;
    let approvalRate = 0;

    if (assignmentIds.length > 0) {
      const checklistItems = await this.checklistRepository.find({
        where: { assignmentId: In(assignmentIds) },
      });

      const byAssignment = new Map<string, ServiceChecklistItem[]>();
      for (const item of checklistItems) {
        const items = byAssignment.get(item.assignmentId) || [];
        items.push(item);
        byAssignment.set(item.assignmentId, items);
      }

      let completedChecklists = 0;
      const totalChecklists = byAssignment.size;

      for (const [, items] of byAssignment) {
        const allDone = items.every((i) =>
          i.status === ChecklistItemStatus.COMPLETED || i.status === ChecklistItemStatus.NA,
        );
        if (allDone) completedChecklists++;
      }

      checklistRate = totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 10000) / 100 : 0;

      const returnedCount = assignments.filter((a) => a.status === AssignmentStatus.RETURNED).length;
      const completedCount = assignments.filter((a) => a.status === AssignmentStatus.COMPLETED).length;
      const totalApproved = completedCount + returnedCount;
      approvalRate = totalApproved > 0 ? Math.round((completedCount / totalApproved) * 10000) / 100 : 0;
    }

    const incidents = assignmentIds.length > 0
      ? await this.incidentRepository.count({ where: { assignmentId: In(assignmentIds) } })
      : 0;

    const incidentFreeRate = assignments.length > 0
      ? Math.round(((assignments.length - incidents) / assignments.length) * 10000) / 100
      : 0;

    const evaluations = await this.evaluationRepository.find({ where: { contractorId } });
    const evaluationAvg = evaluations.length > 0
      ? Math.round((evaluations.reduce((s, e) => s + e.score, 0) / evaluations.length) * 100) / 100
      : null;

    const overallScore = Math.round(
      (checklistRate * 0.3 + approvalRate * 0.25 + incidentFreeRate * 0.25 + (evaluationAvg ? (evaluationAvg / 5) * 100 * 0.2 : 0)) * 100,
    ) / 100;

    return {
      contractorId,
      overallScore,
      checklistRate,
      approvalRate,
      incidentFreeRate,
      evaluationAvg,
      breakdown: {
        checklistRate,
        approvalRate,
        incidentFreeRate,
        evaluationAvg,
        weights: { checklist: 0.3, approval: 0.25, incidentFree: 0.25, evaluation: 0.2 },
      },
    };
  }

  // ── RF-051: Incident History by Contractor ──

  async getIncidentHistory(contractorId: string, page = 1, limit = 20) {
    const assignments = await this.assignmentRepository.find({
      where: { cleanerId: contractorId },
      select: ['id'],
    });
    const assignmentIds = assignments.map((a) => a.id);

    if (assignmentIds.length === 0) {
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }

    const [data, total] = await this.incidentRepository.findAndCount({
      where: { assignmentId: In(assignmentIds) },
      relations: ['assignment', 'assignment.service'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const mapped = data.map((i) => ({
      id: i.id,
      date: i.createdAt.toISOString(),
      type: i.title,
      severity: i.severity,
      status: i.status,
      resolution: i.resolutionNotes,
      serviceAddress: i.assignment?.service?.address || null,
    }));

    return {
      data: mapped,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── RF-052: Evaluations ──

  async createEvaluation(dto: CreateEvaluationDto, userId: string) {
    const contractor = await this.userRepository.findOne({ where: { id: dto.contractorId } });
    if (!contractor) throw new NotFoundException('Contractor not found');

    const assignment = await this.assignmentRepository.findOne({ where: { id: dto.assignmentId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    const evaluation = this.evaluationRepository.create({
      contractorId: dto.contractorId,
      assignmentId: dto.assignmentId,
      evaluatedBy: userId,
      score: dto.score,
      comment: dto.comment || null,
      serviceType: dto.serviceType || null,
    } as SupervisorEvaluation);

    const saved = await this.evaluationRepository.save(evaluation);

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'supervisor_evaluation',
      entityId: saved.id,
      newValues: { contractorId: dto.contractorId, score: dto.score },
    });

    return saved;
  }

  async getEvaluations(contractorId?: string, page = 1, limit = 20) {
    const where: FindOptionsWhere<SupervisorEvaluation> = {};
    if (contractorId) where.contractorId = contractorId;

    const [data, total] = await this.evaluationRepository.findAndCount({
      where,
      relations: ['evaluator', 'assignment', 'assignment.service'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const mapped = data.map((e) => ({
      id: e.id,
      score: e.score,
      comment: e.comment,
      serviceType: e.serviceType || e.assignment?.service?.serviceType || null,
      evaluatorName: e.evaluator ? `${e.evaluator.firstName} ${e.evaluator.lastName}` : null,
      createdAt: e.createdAt.toISOString(),
    }));

    return {
      data: mapped,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getEvaluationById(id: string) {
    const evaluation = await this.evaluationRepository.findOne({
      where: { id },
      relations: ['evaluator', 'contractor', 'assignment'],
    });
    if (!evaluation) throw new NotFoundException('Evaluation not found');
    return evaluation;
  }

  async updateEvaluation(id: string, dto: UpdateEvaluationDto, userId: string) {
    const evaluation = await this.evaluationRepository.findOne({ where: { id } });
    if (!evaluation) throw new NotFoundException('Evaluation not found');

    if (dto.score !== undefined) evaluation.score = dto.score;
    if (dto.comment !== undefined) evaluation.comment = dto.comment;

    const saved = await this.evaluationRepository.save(evaluation);

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'supervisor_evaluation',
      entityId: saved.id,
      newValues: { score: saved.score },
    });

    return saved;
  }

  // ── RF-053: Individual Dashboard ──

  async getIndividualDashboard(contractorId: string) {
    const contractor = await this.userRepository.findOne({ where: { id: contractorId } });
    if (!contractor) throw new NotFoundException('Contractor not found');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const from = thirtyDaysAgo.toISOString();
    const to = now.toISOString();

    const [attendance, punctuality, serviceTime, quality, evaluations, incidents, scoreHistory] =
      await Promise.all([
        this.getAttendanceMetrics(contractorId, from, to),
        this.getPunctualityMetrics(contractorId, from, to),
        this.getServiceTimeMetrics(contractorId, from, to),
        this.getQualityScore(contractorId, from, to),
        this.getEvaluations(contractorId, 1, 10),
        this.getIncidentHistory(contractorId, 1, 10),
        this.getScoreHistory(contractorId, 'monthly', from, to, 1, 12),
      ]);

    const completed = await this.assignmentRepository.count({
      where: {
        cleanerId: contractorId,
        status: AssignmentStatus.COMPLETED,
        scheduledDate: MoreThanOrEqual(thirtyDaysAgo),
      },
    });

    let totalHours = 0;
    const hourAssignments = await this.assignmentRepository.find({
      where: {
        cleanerId: contractorId,
        status: AssignmentStatus.COMPLETED,
        scheduledDate: MoreThanOrEqual(thirtyDaysAgo),
      },
      select: ['totalMinutes'],
    });
    for (const a of hourAssignments) {
      if (a.totalMinutes) totalHours += a.totalMinutes / 60;
    }
    totalHours = Math.round(totalHours * 100) / 100;

    return {
      contractor: {
        id: contractor.id,
        firstName: contractor.firstName,
        lastName: contractor.lastName,
        photoUrl: contractor.photoUrl,
      },
      summary: {
        servicesCompleted: completed,
        totalHours,
        attendanceRate: attendance.attendanceRate,
        punctualityRate: punctuality.punctualityRate,
        qualityScore: quality.overallScore,
        avgEvaluationScore: quality.evaluationAvg,
      },
      attendance,
      punctuality,
      serviceTimeBreakdown: serviceTime,
      recentEvaluations: evaluations.data,
      recentIncidents: incidents.data,
      scoreHistory: scoreHistory.data,
    };
  }

  // ── RF-054: Comparative Report ──

  async getComparativeReport(contractorIds: string[], from: string, to: string) {
    const contractors = await this.userRepository.find({
      where: { id: In(contractorIds) },
    });

    if (contractors.length === 0) throw new BadRequestException('No valid contractors found');

    const entries = [];
    for (const c of contractors) {
      const [attendance, quality, scores] = await Promise.all([
        this.getAttendanceMetrics(c.id, from, to),
        this.getQualityScore(c.id, from, to),
        this.getServiceTimeMetrics(c.id, from, to),
      ]);

      const completed = await this.assignmentRepository.count({
        where: {
          cleanerId: c.id,
          status: AssignmentStatus.COMPLETED,
          scheduledDate: Between(new Date(from), new Date(to)),
        },
      });

      let totalHours = 0;
      const hourAssignments = await this.assignmentRepository.find({
        where: {
          cleanerId: c.id,
          status: AssignmentStatus.COMPLETED,
          scheduledDate: Between(new Date(from), new Date(to)),
        },
        select: ['totalMinutes'],
      });
      for (const a of hourAssignments) {
        if (a.totalMinutes) totalHours += a.totalMinutes / 60;
      }
      totalHours = Math.round(totalHours * 100) / 100;

      const scoresTotal = scores.reduce((s, st) => s + st.avgVarianceMinutes, 0);
      const avgTimeVariance = scores.length > 0 ? Math.round((scoresTotal / scores.length) * 100) / 100 : null;

      const allAssignments = await this.assignmentRepository.find({
        where: { cleanerId: c.id, scheduledDate: Between(new Date(from), new Date(to)) },
        select: ['id'],
      });
      const incidents = allAssignments.length > 0
        ? await this.incidentRepository.count({ where: { assignmentId: In(allAssignments.map((a) => a.id)) } })
        : 0;

      const evaluations = await this.evaluationRepository.find({ where: { contractorId: c.id } });
      const avgEval = evaluations.length > 0
        ? Math.round((evaluations.reduce((s, e) => s + e.score, 0) / evaluations.length) * 100) / 100
        : null;

      entries.push({
        contractorId: c.id,
        contractorName: `${c.firstName} ${c.lastName}`,
        servicesCompleted: completed,
        totalHours,
        attendanceRate: attendance.attendanceRate,
        punctualityRate: attendance.punctualityRate,
        qualityScore: quality.overallScore,
        avgEvaluationScore: avgEval,
        avgTimeVariance,
        incidentCount: incidents,
      });
    }

    const count = entries.length;
    const averages = {
      attendanceRate: count > 0 ? Math.round((entries.reduce((s, e) => s + e.attendanceRate, 0) / count) * 100) / 100 : 0,
      punctualityRate: count > 0 ? Math.round((entries.reduce((s, e) => s + e.punctualityRate, 0) / count) * 100) / 100 : 0,
      qualityScore: count > 0 ? Math.round((entries.reduce((s, e) => s + e.qualityScore, 0) / count) * 100) / 100 : 0,
      servicesCompleted: count > 0 ? Math.round((entries.reduce((s, e) => s + e.servicesCompleted, 0) / count) * 100) / 100 : 0,
    };

    return {
      period: { from, to },
      entries,
      averages,
    };
  }

  // ── Performance Score History ──

  async getScoreHistory(contractorId: string, period: string, from?: string, to?: string, page = 1, limit = 20) {
    const where: any = { contractorId, period };
    if (from) where.periodStart = MoreThanOrEqual(new Date(from));
    if (to) where.periodEnd = LessThanOrEqual(new Date(to));

    const [data, total] = await this.scoreRepository.findAndCount({
      where,
      order: { periodStart: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Compute & Store Score Snapshot ──

  async computeAndStoreScore(contractorId: string, period: ScorePeriod) {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    switch (period) {
      case ScorePeriod.WEEKLY:
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case ScorePeriod.MONTHLY:
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case ScorePeriod.QUARTERLY:
        const q = Math.floor(now.getMonth() / 3);
        periodStart = new Date(now.getFullYear(), q * 3, 1);
        periodEnd = new Date(now.getFullYear(), (q + 1) * 3, 0);
        break;
    }

    const from = periodStart.toISOString();
    const to = periodEnd.toISOString();

    const [attendance, punctuality, quality, serviceTime] = await Promise.all([
      this.getAttendanceMetrics(contractorId, from, to),
      this.getPunctualityMetrics(contractorId, from, to),
      this.getQualityScore(contractorId, from, to),
      this.getServiceTimeMetrics(contractorId, from, to),
    ]);

    const completed = await this.assignmentRepository.count({
      where: {
        cleanerId: contractorId,
        status: AssignmentStatus.COMPLETED,
        scheduledDate: Between(periodStart, periodEnd),
      },
    });

    let totalHours = 0;
    const hourAssignments = await this.assignmentRepository.find({
      where: {
        cleanerId: contractorId,
        status: AssignmentStatus.COMPLETED,
        scheduledDate: Between(periodStart, periodEnd),
      },
      select: ['totalMinutes'],
    });
    for (const a of hourAssignments) {
      if (a.totalMinutes) totalHours += a.totalMinutes / 60;
    }
    totalHours = Math.round(totalHours * 100) / 100;

    const evaluations = await this.evaluationRepository.find({ where: { contractorId } });
    const avgEval = evaluations.length > 0
      ? Math.round((evaluations.reduce((s, e) => s + e.score, 0) / evaluations.length) * 100) / 100
      : null;

    const totalTimeVariance = serviceTime.reduce((s, st) => s + st.avgVarianceMinutes, 0);
    const avgTimeVariance = serviceTime.length > 0 ? Math.round((totalTimeVariance / serviceTime.length) * 100) / 100 : null;

    const allAssignments = await this.assignmentRepository.find({
      where: { cleanerId: contractorId, scheduledDate: Between(periodStart, periodEnd) },
      select: ['id'],
    });
    const incidentCount = allAssignments.length > 0
      ? await this.incidentRepository.count({ where: { assignmentId: In(allAssignments.map((a) => a.id)) } })
      : 0;

    const existing = await this.scoreRepository.findOne({
      where: { contractorId, period, periodStart },
    });

    const data: Partial<PerformanceScore> = {
      periodStart,
      periodEnd,
      attendanceRate: attendance.attendanceRate,
      punctualityRate: punctuality.punctualityRate,
      qualityScore: quality.overallScore,
      checklistCompletionRate: quality.checklistRate,
      incidentCount,
      servicesCompleted: completed,
      totalHours,
      avgEvaluationScore: avgEval ?? undefined,
      evaluationCount: evaluations.length,
      avgTimeVariance: avgTimeVariance ?? undefined,
      details: {
        punctuality,
        serviceTimeBreakdown: serviceTime,
        qualityBreakdown: quality.breakdown,
        attendance: {
          totalAssigned: attendance.totalAssigned,
          totalAttended: attendance.totalAttended,
          totalAbsences: attendance.totalAbsences,
          totalLateArrivals: attendance.totalLateArrivals,
        },
      },
    };

    if (existing) {
      Object.assign(existing, data);
      return this.scoreRepository.save(existing);
    }

    return this.scoreRepository.save(
      this.scoreRepository.create({ contractorId, period, ...data } as PerformanceScore),
    );
  }

  // ── Helpers ──

  private parseTime(time: string, date: Date): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d;
  }
}
