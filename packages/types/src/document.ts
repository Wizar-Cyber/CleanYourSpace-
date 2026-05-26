import { z } from 'zod';
import { DocumentCategory } from './enums';

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  category: z.nativeEnum(DocumentCategory),
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  url: z.string(),
  uploadedAt: z.string().datetime(),
});

export type Document = z.infer<typeof DocumentSchema>;

export const CreateDocumentDto = z.object({
  userId: z.string().uuid(),
  category: z.nativeEnum(DocumentCategory),
  filename: z.string().min(1),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().nonnegative(),
  url: z.string().url(),
});

export type CreateDocumentDto = z.infer<typeof CreateDocumentDto>;

export const DocumentResponse = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  category: z.nativeEnum(DocumentCategory),
  filename: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  url: z.string(),
  uploadedAt: z.string().datetime(),
});

export type DocumentResponse = z.infer<typeof DocumentResponse>;
