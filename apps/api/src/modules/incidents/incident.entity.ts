import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { ServiceAssignment } from '../assignments/assignment.entity';

export enum IncidentStatus {
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('incidents')
@Index(['assignmentId', 'status'])
@Index(['reportedBy'])
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'assignment_id' })
  assignmentId: string;

  @Column({ name: 'reported_by' })
  reportedBy: string;

  @Column({ length: 300 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: IncidentStatus, default: IncidentStatus.OPEN })
  status: IncidentStatus;

  @Column({ type: 'enum', enum: IncidentSeverity, default: IncidentSeverity.LOW })
  severity: IncidentSeverity;

  @Column({ name: 'photo_urls', type: 'json', nullable: true })
  photoUrls: string[];

  @Column({ name: 'resolved_by', nullable: true })
  resolvedBy: string;

  @Column({ name: 'resolved_at', nullable: true, type: 'timestamp' })
  resolvedAt: Date;

  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes: string;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy: string;

  @Column({ name: 'reviewed_at', nullable: true, type: 'timestamp' })
  reviewedAt: Date;

  @Column({ name: 'is_synced', default: false })
  isSynced: boolean;

  @ManyToOne(() => User, (u) => u.id)
  @JoinColumn({ name: 'reported_by' })
  reporter: User;

  @ManyToOne(() => ServiceAssignment, (a) => a.id)
  @JoinColumn({ name: 'assignment_id' })
  assignment: ServiceAssignment;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}