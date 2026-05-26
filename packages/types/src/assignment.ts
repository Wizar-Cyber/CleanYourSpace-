import { z } from 'zod';
import { AssignmentStatus } from './enums';

export const ServiceAssignmentSchema = z.object({
  id: z.string().uuid(),
  serviceId: z.string().uuid(),
  cleanerId: z.string().uuid(),
  scheduledDate: z.string().datetime(),
  scheduledStartTime: z.string(),
  scheduledEndTime: z.string(),
  status: z.nativeEnum(AssignmentStatus),
  timerStart: z.string().datetime().nullable(),
  timerEnd: z.string().datetime().nullable(),
  totalMinutes: z.number().int().nonnegative().nullable(),
  hourlyRateSnapshot: z.number().nonnegative().nullable(),
  paymentCalculated: z.number().nonnegative().nullable(),
  notes: z.string().nullable(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ServiceAssignment = z.infer<typeof ServiceAssignmentSchema>;

export const CreateAssignmentDto = z.object({
  serviceId: z.string().uuid(),
  cleanerId: z.string().uuid(),
  scheduledDate: z.string().datetime(),
  scheduledStartTime: z.string(),
  scheduledEndTime: z.string(),
  notes: z.string().nullable().optional(),
});

export type CreateAssignmentDto = z.infer<typeof CreateAssignmentDto>;

export const UpdateAssignmentDto = z.object({
  status: z.nativeEnum(AssignmentStatus).optional(),
  startedAt: z.string().datetime().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  timerStart: z.string().datetime().nullable().optional(),
  timerEnd: z.string().datetime().nullable().optional(),
  totalMinutes: z.number().int().nonnegative().nullable().optional(),
});

export type UpdateAssignmentDto = z.infer<typeof UpdateAssignmentDto>;

export const AssignmentWithService = ServiceAssignmentSchema.extend({
  serviceName: z.string(),
  cleanerName: z.string(),
});

export type AssignmentWithService = z.infer<typeof AssignmentWithService>;
