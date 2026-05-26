import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum NotificationType {
  SERVICE_STARTED = 'service_started',
  SERVICE_PENDING_VERIFICATION = 'service_pending_verification',
  SERVICE_RETURNED = 'service_returned',
  SERVICE_COMPLETED = 'service_completed',
  SERVICE_CANCELLED = 'service_cancelled',
  SERVICE_NEEDS_REVIEW = 'service_needs_review',
  SERVICE_ASSIGNED = 'service_assigned',
  CHECKLIST_RETURNED = 'checklist_returned',
  INCIDENT_REPORTED = 'incident_reported',
  TIME_APPROVED = 'time_approved',
  TIME_REJECTED = 'time_rejected',
  ON_THE_WAY = 'on_the_way',
  REMINDER_24H = 'reminder_24h',
  REMINDER_2H = 'reminder_2h',
  STOCK_ALERT = 'stock_alert',
  LOCATION_ALERT = 'location_alert',
  CLEANER_DEACTIVATED_WITH_ACTIVE_SERVICE = 'cleaner_deactivated_with_active_service',
  SYSTEM = 'system',
}

@Entity('notifications')
@Index(['userId', 'read'])
@Index(['recipientId'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'recipient_id', nullable: true })
  recipientId: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, unknown>;

  @Column({ name: 'related_service_id', nullable: true })
  relatedServiceId: string;

  @Column({ name: 'related_alert_id', nullable: true })
  relatedAlertId: string;

  @Column({ default: false })
  read: boolean;

  @Column({ name: 'read_at', nullable: true, type: 'timestamp' })
  readAt: Date;

  @ManyToOne(() => User, (u) => u.notifications)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
