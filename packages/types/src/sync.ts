import { z } from 'zod';
import { SyncAction, SyncEntity, SyncStatus } from './enums';

export const OfflineSyncQueueSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  entity: z.nativeEnum(SyncEntity),
  entityId: z.string().uuid(),
  action: z.nativeEnum(SyncAction),
  payload: z.record(z.unknown()),
  status: z.nativeEnum(SyncStatus),
  retryCount: z.number().int().nonnegative(),
  error: z.string().nullable(),
  createdAt: z.string().datetime(),
  processedAt: z.string().datetime().nullable(),
});

export type OfflineSyncQueue = z.infer<typeof OfflineSyncQueueSchema>;

export const SyncQueueItem = z.object({
  id: z.string(),
  entity: z.nativeEnum(SyncEntity),
  entityId: z.string(),
  action: z.nativeEnum(SyncAction),
  payload: z.record(z.unknown()),
  timestamp: z.number(),
});

export type SyncQueueItem = z.infer<typeof SyncQueueItem>;
