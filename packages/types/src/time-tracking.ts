import { z } from 'zod';

export const TimeRecordType = {
  CLOCK_IN: 'clock_in',
  CLOCK_OUT: 'clock_out',
  PERIODIC_LOG: 'periodic_log',
} as const;

export const TimeApprovalStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  ADJUSTED: 'adjusted',
  REJECTED: 'rejected',
} as const;

export const InconsistencyType = {
  GPS_OUTSIDE_AREA: 'gps_outside_area',
  EXCESSIVE_TIME: 'excessive_time',
  INSUFFICIENT_TIME: 'insufficient_time',
  MISSING_CLOCK_OUT: 'missing_clock_out',
  OVERLAPPING_SESSION: 'overlapping_session',
} as const;

export const TimeRecordSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.enum(['clock_in', 'clock_out', 'periodic_log']),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  accuracy: z.number().nullable(),
  timestamp: z.string().datetime(),
  isWithinRadius: z.boolean().nullable(),
  geofenceRadius: z.number().int().positive().default(200),
  distanceFromService: z.number().nullable(),
  approvalStatus: z.enum(['pending', 'approved', 'adjusted', 'rejected']).default('pending'),
  approvedBy: z.string().uuid().nullable(),
  approvedAt: z.string().datetime().nullable(),
  adjustedMinutes: z.number().int().nullable(),
  adjustmentReason: z.string().nullable(),
  inconsistencies: z.array(z.string()).default([]),
  isSynced: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TimeRecord = z.infer<typeof TimeRecordSchema>;

export const ClockInDto = z.object({
  assignmentId: z.string().uuid(),
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
});

export type ClockInDto = z.infer<typeof ClockInDto>;

export const ClockOutDto = z.object({
  assignmentId: z.string().uuid(),
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
});

export type ClockOutDto = z.infer<typeof ClockOutDto>;

export const ApproveTimeDto = z.object({
  approved: z.boolean(),
  adjustedMinutes: z.number().int().nullable().optional(),
  adjustmentReason: z.string().nullable().optional(),
});

export type ApproveTimeDto = z.infer<typeof ApproveTimeDto>;

export const TimeHistoryQuery = z.object({
  cleanerId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type TimeHistoryQuery = z.infer<typeof TimeHistoryQuery>;

export const HourReportQuery = z.object({
  cleanerId: z.string().uuid().optional(),
  period: z.enum(['day', 'week', 'month', 'custom']).default('week'),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  format: z.enum(['pdf', 'excel']).default('pdf'),
});

export type HourReportQuery = z.infer<typeof HourReportQuery>;

export interface TimeRecordResponse {
  id: string;
  assignmentId: string;
  userId: string;
  type: 'clock_in' | 'clock_out' | 'periodic_log';
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: string;
  isWithinRadius: boolean | null;
  geofenceRadius: number;
  distanceFromService: number | null;
  approvalStatus: string;
  approvedBy: string | null;
  approvedAt: string | null;
  adjustedMinutes: number | null;
  adjustmentReason: string | null;
  inconsistencies: string[];
  createdAt: string;
  updatedAt: string;
  assignment?: {
    id: string;
    clientName?: string;
    serviceName?: string;
    status?: string;
  };
}

export interface HourReportSummary {
  totalHours: number;
  approvedHours: number;
  pendingHours: number;
  totalEarnings: number;
  records: TimeRecordResponse[];
  period: {
    from: string;
    to: string;
  };
}

export interface TimeTrackingStats {
  totalClockIns: number;
  totalClockOuts: number;
  totalMinutesTracked: number;
  totalApprovedMinutes: number;
  pendingApprovalMinutes: number;
  inconsistenciesCount: number;
}
