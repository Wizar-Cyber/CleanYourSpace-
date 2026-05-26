import { z } from 'zod';

export const CreateIncidentDto = z.object({
  assignmentId: z.string().uuid(),
  title: z.string().min(3).max(300),
  description: z.string().min(10),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
  photoUrls: z.array(z.string()).optional(),
});

export type CreateIncidentDto = z.infer<typeof CreateIncidentDto>;

export const UpdateIncidentDto = z.object({
  status: z.enum(['open', 'in_review', 'resolved', 'closed']),
  resolutionNotes: z.string().optional(),
});

export type UpdateIncidentDto = z.infer<typeof UpdateIncidentDto>;