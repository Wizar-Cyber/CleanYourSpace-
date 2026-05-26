import { z } from 'zod';

export const SupplyCategory = {
  CHEMICAL: 'chemical',
  TOOL: 'tool',
  PPE: 'ppe',
  PAPER: 'paper',
  BAG: 'bag',
  OTHER: 'other',
} as const;

export const TransactionType = {
  IN: 'in',
  OUT: 'out',
  ADJUSTMENT: 'adjustment',
} as const;

export const SupplyItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  category: z.enum(['chemical', 'tool', 'ppe', 'paper', 'bag', 'other']),
  unitOfMeasure: z.string().min(1).max(50),
  stockMin: z.number().int().min(0),
  currentStock: z.number().min(0),
  supplier: z.string().max(200).nullable(),
  sku: z.string().max(100).nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type SupplyItem = z.infer<typeof SupplyItemSchema>;

export const CreateSupplyItemDto = z.object({
  name: z.string().min(1).max(200),
  category: z.enum(['chemical', 'tool', 'ppe', 'paper', 'bag', 'other']),
  unitOfMeasure: z.string().min(1).max(50),
  stockMin: z.number().int().min(0).default(5),
  currentStock: z.number().min(0).default(0),
  supplier: z.string().max(200).optional(),
  sku: z.string().max(100).optional(),
});

export type CreateSupplyItemDto = z.infer<typeof CreateSupplyItemDto>;

export const UpdateSupplyItemDto = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.enum(['chemical', 'tool', 'ppe', 'paper', 'bag', 'other']).optional(),
  unitOfMeasure: z.string().min(1).max(50).optional(),
  stockMin: z.number().int().min(0).optional(),
  currentStock: z.number().min(0).optional(),
  supplier: z.string().max(200).nullable().optional(),
  sku: z.string().max(100).nullable().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateSupplyItemDto = z.infer<typeof UpdateSupplyItemDto>;

export const InventoryTransactionSchema = z.object({
  id: z.string().uuid(),
  supplyItemId: z.string().uuid(),
  type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.number(),
  unitOfMeasure: z.string(),
  previousStock: z.number(),
  newStock: z.number(),
  reference: z.string().nullable(),
  serviceId: z.string().uuid().nullable(),
  contractorId: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export type InventoryTransaction = z.infer<typeof InventoryTransactionSchema>;

export const CreateInventoryTransactionDto = z.object({
  supplyItemId: z.string().uuid(),
  type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.number(),
  reference: z.string().max(200).optional(),
  serviceId: z.string().uuid().optional(),
  contractorId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

export type CreateInventoryTransactionDto = z.infer<typeof CreateInventoryTransactionDto>;

export const SupplyQueryDto = z.object({
  category: z.enum(['chemical', 'tool', 'ppe', 'paper', 'bag', 'other']).optional(),
  lowStock: z.coerce.boolean().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type SupplyQueryDto = z.infer<typeof SupplyQueryDto>;

export const SupplyTransactionQueryDto = z.object({
  supplyItemId: z.string().uuid().optional(),
  type: z.enum(['in', 'out', 'adjustment']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type SupplyTransactionQueryDto = z.infer<typeof SupplyTransactionQueryDto>;

export const ConsumptionReportQueryDto = z.object({
  from: z.string(),
  to: z.string(),
  contractorId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  supplyItemId: z.string().uuid().optional(),
});

export type ConsumptionReportQueryDto = z.infer<typeof ConsumptionReportQueryDto>;

export const ConsumptionReportEntrySchema = z.object({
  supplyItemId: z.string().uuid(),
  supplyName: z.string(),
  category: z.string(),
  totalConsumed: z.number(),
  unitOfMeasure: z.string(),
  transactions: z.number().int(),
});

export type ConsumptionReportEntry = z.infer<typeof ConsumptionReportEntrySchema>;

export const ConsumptionReportSchema = z.object({
  period: z.object({ from: z.string(), to: z.string() }),
  entries: z.array(ConsumptionReportEntrySchema),
  totalItems: z.number().int(),
  grandTotalConsumed: z.number(),
});

export type ConsumptionReport = z.infer<typeof ConsumptionReportSchema>;

export const StockAlertSchema = z.object({
  supplyItemId: z.string().uuid(),
  supplyName: z.string(),
  category: z.string(),
  currentStock: z.number(),
  stockMin: z.number(),
  unitOfMeasure: z.string(),
});

export type StockAlert = z.infer<typeof StockAlertSchema>;
