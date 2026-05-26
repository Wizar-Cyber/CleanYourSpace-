import { z } from 'zod';

export const LocationLogSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  assignmentId: z.string().uuid().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().nullable(),
  timestamp: z.string().datetime(),
  isWithinRadius: z.boolean().nullable(),
  isSynced: z.boolean(),
  createdAt: z.string().datetime(),
});

export type LocationLog = z.infer<typeof LocationLogSchema>;

export const LocationAlertSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  type: z.enum(['radius_exceeded', 'radius_restored', 'off_route']),
  latitude: z.number(),
  longitude: z.number(),
  expectedLatitude: z.number(),
  expectedLongitude: z.number(),
  distance: z.number(),
  resolved: z.boolean(),
  graceEndsAt: z.string().datetime().nullable(),
  alertSentAt: z.string().datetime().nullable(),
  reviewedBy: z.string().uuid().nullable(),
  reviewedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable(),
});

export type LocationAlert = z.infer<typeof LocationAlertSchema>;

export const CreateLocationLogDto = z.object({
  assignmentId: z.string().uuid().nullable().optional(),
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().nullable().optional(),
  timestamp: z.string().datetime(),
  isWithinRadius: z.boolean().nullable().optional(),
});

export type CreateLocationLogDto = z.infer<typeof CreateLocationLogDto>;
