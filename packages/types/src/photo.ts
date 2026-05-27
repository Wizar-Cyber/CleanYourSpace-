import { z } from 'zod';
import { PhotoCategory, PhotoStatus } from './enums';

export const PhotoSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  serviceId: z.string().uuid().nullable(),
  checklistItemId: z.string().uuid().nullable(),
  uploadedBy: z.string().uuid(),
  category: z.nativeEnum(PhotoCategory),
  type: z.string().nullable(),
  status: z.nativeEnum(PhotoStatus),
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  filePath: z.string().nullable(),
  fileSizeKb: z.number().nonnegative().nullable(),
  compressedSize: z.number().int().nullable(),
  url: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  takenAt: z.string().datetime().nullable(),
  uploadedAt: z.string().datetime().nullable(),
  isSynced: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Photo = z.infer<typeof PhotoSchema>;

export const CreatePhotoDto = z.object({
  assignmentId: z.string().uuid(),
  serviceId: z.string().uuid().nullable().optional(),
  checklistItemId: z.string().uuid().nullable().optional(),
  category: z.nativeEnum(PhotoCategory),
  type: z.string().nullable().optional(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number().int().nonnegative().max(512000), // 500KB max
  filePath: z.string().nullable().optional(),
  fileSizeKb: z.number().nonnegative().max(500).nullable().optional(), // 500KB max
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  takenAt: z.string().datetime().nullable().optional(),
});

export type CreatePhotoDto = z.infer<typeof CreatePhotoDto>;
