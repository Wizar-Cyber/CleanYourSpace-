import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToMany, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { ServiceAssignment } from '../assignments/assignment.entity';

export enum ServiceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  NEEDS_REVIEW = 'needs_review',
  CANCELLED = 'cancelled',
}

@Entity('services')
@Index(['status', 'scheduledAt'])
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_name', length: 200 })
  clientName: string;

  @Column({ name: 'client_email', nullable: true })
  clientEmail: string;

  @Column({ name: 'client_phone', length: 20, nullable: true })
  clientPhone: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ name: 'access_instructions', type: 'text', nullable: true })
  accessInstructions: string;

  @Column({ name: 'service_type', length: 100 })
  serviceType: string;

  @Column({ name: 'custom_service_type', length: 100, nullable: true })
  customServiceType: string;

  @Column({ type: 'enum', enum: ServiceStatus, default: ServiceStatus.SCHEDULED })
  status: ServiceStatus;

  @Column({ name: 'scheduled_at', type: 'timestamp' })
  scheduledAt: Date;

  @Column({ name: 'estimated_minutes', type: 'int' })
  estimatedMinutes: number;

  @Column({ name: 'special_instructions', type: 'text', nullable: true })
  specialInstructions: string;

  @Column({ name: 'checklist_template_id', nullable: true })
  checklistTemplateId: string;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ name: 'cancelled_at', nullable: true, type: 'timestamp' })
  cancelledAt: Date;

  @Column({ name: 'cancelled_by', nullable: true })
  cancelledBy: string;

  @Column({ name: 'needs_review_reason', type: 'text', nullable: true })
  needsReviewReason: string;

  @Column({ name: 'has_incidents', default: false })
  hasIncidents: boolean;

  @Column({ name: 'is_checklist_complete', default: true })
  isChecklistComplete: boolean;

  @Column({ name: 'parent_service_id', nullable: true })
  parentServiceId: string;

  @Column({ name: 'recurrence_rule', length: 20, nullable: true })
  recurrenceRule: string;

  @Column({ name: 'recurrence_end_date', nullable: true, type: 'timestamp' })
  recurrenceEndDate: Date;

  @Column({ name: 'recurrence_instance', type: 'int', nullable: true })
  recurrenceInstance: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ServiceAssignment, (a) => a.service)
  assignments: ServiceAssignment[];

  @ManyToOne(() => Service, { nullable: true })
  @JoinColumn({ name: 'parent_service_id' })
  parentService: Service;
}
