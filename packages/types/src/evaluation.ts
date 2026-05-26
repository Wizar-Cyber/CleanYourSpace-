import { z } from 'zod';

export const EvaluationSchema = z.object({
  id: z.string().uuid(),
  contractorId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  evaluatedBy: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  serviceType: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Evaluation = z.infer<typeof EvaluationSchema>;

export const CreateEvaluationDto = z.object({
  contractorId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  serviceType: z.string().max(100).optional(),
});

export type CreateEvaluationDto = z.infer<typeof CreateEvaluationDto>;

export const UpdateEvaluationDto = z.object({
  score: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
});

export type UpdateEvaluationDto = z.infer<typeof UpdateEvaluationDto>;

export const EvaluationQueryDto = z.object({
  contractorId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type EvaluationQueryDto = z.infer<typeof EvaluationQueryDto>;
