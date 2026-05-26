import { z } from 'zod';
import { ReportFormat, ReportType } from './enums';

export const ReportSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(ReportType),
  format: z.nativeEnum(ReportFormat),
  generatedBy: z.string().uuid(),
  url: z.string().nullable(),
  filePathPdf: z.string().nullable(),
  filePathXlsx: z.string().nullable(),
  filename: z.string(),
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.string().datetime(),
});

export type Report = z.infer<typeof ReportSchema>;

export const GenerateReportDto = z.object({
  type: z.nativeEnum(ReportType),
  format: z.nativeEnum(ReportFormat),
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
});

export type GenerateReportDto = z.infer<typeof GenerateReportDto>;

export const WeeklyReportData = z.object({
  totalServices: z.number(),
  completedServices: z.number(),
  pendingServices: z.number(),
  totalCleaners: z.number(),
  activeCleaners: z.number(),
  averageRating: z.number().nullable(),
  topCleaner: z.object({
    id: z.string(),
    name: z.string(),
    completedJobs: z.number(),
  }).nullable(),
});

export type WeeklyReportData = z.infer<typeof WeeklyReportData>;
