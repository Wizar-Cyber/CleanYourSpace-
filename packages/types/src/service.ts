import { z } from 'zod';
import { ServiceStatus, RecurrenceFrequency, ServiceTypeCategory } from './enums';

export const ServiceSchema = z.object({
  id: z.string().uuid(),
  clientName: z.string().min(1).max(200),
  clientEmail: z.string().email().nullable().optional(),
  clientPhone: z.string().max(20).nullable().optional(),
  address: z.string().min(1),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  accessInstructions: z.string().nullable().optional(),
  serviceType: z.nativeEnum(ServiceTypeCategory).or(z.string()),
  customServiceType: z.string().nullable().optional(),
  status: z.nativeEnum(ServiceStatus),
  scheduledAt: z.string().datetime(),
  estimatedMinutes: z.number().int().positive(),
  specialInstructions: z.string().nullable().optional(),
  checklistTemplateId: z.string().uuid().nullable(),
  assignedStaffIds: z.array(z.string().uuid()).optional(),
  cancellationReason: z.string().nullable().optional(),
  cancelledAt: z.string().datetime().nullable().optional(),
  cancelledBy: z.string().uuid().nullable().optional(),
  needsReviewReason: z.string().nullable().optional(),
  verifiedBy: z.string().uuid().nullable(),
  verifiedAt: z.string().datetime().nullable(),
  hasIncidents: z.boolean().optional().default(false),
  isChecklistComplete: z.boolean().optional().default(true),
  parentServiceId: z.string().uuid().nullable().optional(),
  recurrenceRule: z.nativeEnum(RecurrenceFrequency).nullable().optional(),
  recurrenceEndDate: z.string().datetime().nullable().optional(),
  recurrenceInstance: z.number().int().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Service = z.infer<typeof ServiceSchema>;

export const CreateServiceDto = z.object({
  clientName: z.string().min(1).max(200),
  clientEmail: z.string().email().nullable().optional(),
  clientPhone: z.string().max(20).nullable().optional(),
  address: z.string().min(1),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  accessInstructions: z.string().nullable().optional(),
  serviceType: z.nativeEnum(ServiceTypeCategory).or(z.string()),
  customServiceType: z.string().nullable().optional(),
  scheduledAt: z.string().datetime(),
  estimatedMinutes: z.number().int().positive(),
  specialInstructions: z.string().nullable().optional(),
  checklistTemplateId: z.string().uuid().nullable().optional(),
  assignedStaffIds: z.array(z.string().uuid()).optional(),
  recurrenceRule: z.nativeEnum(RecurrenceFrequency).nullable().optional(),
  recurrenceEndDate: z.string().datetime().nullable().optional(),
});

export type CreateServiceDto = z.infer<typeof CreateServiceDto>;

export const UpdateServiceDto = z.object({
  clientName: z.string().min(1).max(200).optional(),
  clientEmail: z.string().email().nullable().optional(),
  clientPhone: z.string().max(20).nullable().optional(),
  address: z.string().min(1).optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  accessInstructions: z.string().nullable().optional(),
  serviceType: z.nativeEnum(ServiceTypeCategory).or(z.string()).optional(),
  customServiceType: z.string().nullable().optional(),
  scheduledAt: z.string().datetime().optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  specialInstructions: z.string().nullable().optional(),
  checklistTemplateId: z.string().uuid().nullable().optional(),
  assignedStaffIds: z.array(z.string().uuid()).optional(),
  recurrenceRule: z.nativeEnum(RecurrenceFrequency).nullable().optional(),
  recurrenceEndDate: z.string().datetime().nullable().optional(),
});

export type UpdateServiceDto = z.infer<typeof UpdateServiceDto>;

export const CancelServiceDto = z.object({
  reason: z.string().min(1, 'Cancellation reason is required'),
});

export type CancelServiceDto = z.infer<typeof CancelServiceDto>;

export const ServiceResponse = ServiceSchema;

export type ServiceResponse = z.infer<typeof ServiceResponse>;

export const ApproveServiceDto = z.object({
  verifiedBy: z.string().uuid(),
});

export type ApproveServiceDto = z.infer<typeof ApproveServiceDto>;

export const RejectServiceDto = z.object({
  rejectionNote: z.string().min(1),
  verifiedBy: z.string().uuid(),
});

export type RejectServiceDto = z.infer<typeof RejectServiceDto>;

export const RescheduleServiceDto = z.object({
  scheduledAt: z.string().datetime(),
});

export type RescheduleServiceDto = z.infer<typeof RescheduleServiceDto>;

export const ServiceHistoryQueryDto = z.object({
  clientName: z.string().optional(),
  contractorId: z.string().uuid().optional(),
  serviceType: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  status: z.nativeEnum(ServiceStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ServiceHistoryQueryDto = z.infer<typeof ServiceHistoryQueryDto>;

export const CalendarQueryDto = z.object({
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  view: z.enum(['day', 'week', 'month']).default('month'),
});

export type CalendarQueryDto = z.infer<typeof CalendarQueryDto>;

export const ServiceTypeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  category: z.nativeEnum(ServiceTypeCategory).nullable().optional(),
  isActive: z.boolean().default(true),
  isCustom: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ServiceType = z.infer<typeof ServiceTypeSchema>;

export const CreateServiceTypeDto = z.object({
  name: z.string().min(1).max(100),
  category: z.nativeEnum(ServiceTypeCategory).nullable().optional(),
});

export type CreateServiceTypeDto = z.infer<typeof CreateServiceTypeDto>;
