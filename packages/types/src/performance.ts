import { z } from 'zod';

export const ScorePeriod = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
} as const;

export const PerformanceScoreSchema = z.object({
  id: z.string().uuid(),
  contractorId: z.string().uuid(),
  period: z.enum(['weekly', 'monthly', 'quarterly']),
  periodStart: z.string(),
  periodEnd: z.string(),
  attendanceRate: z.number(),
  punctualityRate: z.number(),
  avgTimeVariance: z.number().nullable(),
  qualityScore: z.number(),
  checklistCompletionRate: z.number(),
  incidentCount: z.number().int(),
  servicesCompleted: z.number().int(),
  totalHours: z.number(),
  avgEvaluationScore: z.number().nullable(),
  evaluationCount: z.number().int(),
  details: z.record(z.unknown()).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type PerformanceScore = z.infer<typeof PerformanceScoreSchema>;

export const PerformanceQueryDto = z.object({
  contractorId: z.string().uuid().optional(),
  period: z.enum(['weekly', 'monthly', 'quarterly']).default('monthly'),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type PerformanceQueryDto = z.infer<typeof PerformanceQueryDto>;

export const ComparativeReportQueryDto = z.object({
  contractorIds: z.array(z.string().uuid()).optional(),
  from: z.string(),
  to: z.string(),
  metrics: z.array(z.string()).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ComparativeReportQueryDto = z.infer<typeof ComparativeReportQueryDto>;

export const AttendanceMetricsSchema = z.object({
  contractorId: z.string().uuid(),
  totalAssigned: z.number().int(),
  totalAttended: z.number().int(),
  totalAbsences: z.number().int(),
  totalLateArrivals: z.number().int(),
  attendanceRate: z.number(),
  punctualityRate: z.number(),
});

export type AttendanceMetrics = z.infer<typeof AttendanceMetricsSchema>;

export const PunctualityMetricsSchema = z.object({
  onTimeCount: z.number().int(),
  lateCount: z.number().int(),
  lateThresholdMinutes: z.number(),
  punctualityRate: z.number(),
});

export type PunctualityMetrics = z.infer<typeof PunctualityMetricsSchema>;

export const ServiceTimeMetricsSchema = z.object({
  serviceType: z.string(),
  totalServices: z.number().int(),
  avgActualMinutes: z.number(),
  avgEstimatedMinutes: z.number(),
  avgVarianceMinutes: z.number(),
  variancePercent: z.number(),
});

export type ServiceTimeMetrics = z.infer<typeof ServiceTimeMetricsSchema>;

export const QualityScoreSchema = z.object({
  contractorId: z.string().uuid(),
  overallScore: z.number(),
  checklistRate: z.number(),
  approvalRate: z.number(),
  incidentFreeRate: z.number(),
  evaluationAvg: z.number().nullable(),
  breakdown: z.record(z.unknown()),
});

export type QualityScore = z.infer<typeof QualityScoreSchema>;

export interface ContractorPerformanceSummary {
  contractorId: string;
  contractorName: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  servicesCompleted: number;
  totalHours: number;
  attendanceRate: number;
  punctualityRate: number;
  qualityScore: number;
  avgEvaluationScore: number | null;
  incidentCount: number;
}

export interface ComparativeReportEntry {
  contractorId: string;
  contractorName: string;
  servicesCompleted: number;
  totalHours: number;
  attendanceRate: number;
  punctualityRate: number;
  qualityScore: number;
  avgEvaluationScore: number | null;
  avgTimeVariance: number | null;
  incidentCount: number;
}

export interface ComparativeReport {
  period: { from: string; to: string };
  entries: ComparativeReportEntry[];
  averages: {
    attendanceRate: number;
    punctualityRate: number;
    qualityScore: number;
    servicesCompleted: number;
  };
}

export interface IndividualDashboard {
  contractor: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  };
  summary: {
    servicesCompleted: number;
    totalHours: number;
    attendanceRate: number;
    punctualityRate: number;
    qualityScore: number;
    avgEvaluationScore: number | null;
  };
  attendance: AttendanceMetrics;
  punctuality: PunctualityMetrics;
  serviceTimeBreakdown: ServiceTimeMetrics[];
  recentEvaluations: Evaluation[];
  recentIncidents: IncidentSummary[];
  scoreHistory: PerformanceScore[];
}

export interface IncidentSummary {
  id: string;
  date: string;
  type: string;
  severity: string;
  status: string;
  resolution: string | null;
  serviceAddress: string | null;
}

export interface Evaluation {
  id: string;
  score: number;
  comment: string | null;
  serviceType: string | null;
  evaluatorName: string | null;
  createdAt: string;
}
