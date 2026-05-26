import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

export enum SyncAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum SyncEntityType {
  SERVICE = 'service',
  ASSIGNMENT = 'assignment',
  CHECKLIST_ITEM = 'checklist_item',
  PHOTO = 'photo',
  LOCATION_LOG = 'location_log',
}

export enum SyncStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('offline_sync_queue')
@Index(['userId', 'status'])
@Index(['createdAt'])
export class OfflineSyncQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: SyncEntityType })
  entity: SyncEntityType;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ type: 'enum', enum: SyncAction })
  action: SyncAction;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ type: 'enum', enum: SyncStatus, default: SyncStatus.PENDING })
  status: SyncStatus;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @Column({ nullable: true, type: 'text' })
  error: string;

  @Column({ name: 'processed_at', nullable: true, type: 'timestamp' })
  processedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
