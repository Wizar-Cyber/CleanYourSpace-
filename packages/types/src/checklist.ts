import { z } from 'zod';
import { ChecklistItemStatus } from './enums';

export const ChecklistTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ChecklistTemplate = z.infer<typeof ChecklistTemplateSchema>;

export const ChecklistTemplateItemSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid(),
  label: z.string().min(1).max(300),
  order: z.number().int().nonnegative(),
  required: z.boolean(),
  category: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ChecklistTemplateItem = z.infer<typeof ChecklistTemplateItemSchema>;

export const ServiceChecklistItemSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  templateItemId: z.string().uuid(),
  status: z.nativeEnum(ChecklistItemStatus),
  completedAt: z.string().datetime().nullable(),
  completedBy: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  photoId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ServiceChecklistItem = z.infer<typeof ServiceChecklistItemSchema>;

export const CreateChecklistTemplateDto = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  items: z.array(
    z.object({
      label: z.string().min(1).max(300),
      order: z.number().int().nonnegative(),
      required: z.boolean(),
      category: z.string().nullable().optional(),
      requiresPhoto: z.boolean().optional(),
      maxPhotos: z.number().int().nonnegative().optional(),
    }),
  ),
});

export type CreateChecklistTemplateDto = z.infer<typeof CreateChecklistTemplateDto>;

export const UpdateChecklistItemDto = z.object({
  status: z.nativeEnum(ChecklistItemStatus),
  notes: z.string().nullable().optional(),
  photoId: z.string().uuid().optional(),
});

export type UpdateChecklistItemDto = z.infer<typeof UpdateChecklistItemDto>;
