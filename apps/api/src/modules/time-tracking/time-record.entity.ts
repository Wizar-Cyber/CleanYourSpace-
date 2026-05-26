import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { ServiceAssignment } from '../assignments/assignment.entity';

export enum TimeRecordType {
  CLOCK_IN = 'clock_in',
  CLOCK_OUT = 'clock_out',
  PERIODIC_LOG = 'periodic_log',
}

export enum TimeApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  ADJUSTED = 'adjusted',
  REJECTED = 'rejected',
}

@Entity('time_records')
@Index(['userId', 'assignmentId'])
@Index(['assignmentId', 'type'])
@Index(['timestamp'])
@Index(['approvalStatus'])
export class TimeRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'assignment_id' })
  assignmentId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: TimeRecordType })
  type: TimeRecordType;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  accuracy: number;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ name: 'is_within_radius', nullable: true })
  isWithinRadius: boolean;

  @Column({ name: 'geofence_radius', type: 'int', default: 200 })
  geofenceRadius: number;

  @Column({ name: 'distance_from_service', type: 'decimal', precision: 10, scale: 2, nullable: true })
  distanceFromService: number;

  @Column({
    name: 'approval_status',
    type: 'enum',
    enum: TimeApprovalStatus,
    default: TimeApprovalStatus.PENDING,
  })
  approvalStatus: TimeApprovalStatus;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string;

  @Column({ name: 'approved_at', nullable: true, type: 'timestamp' })
  approvedAt: Date;

  @Column({ name: 'adjusted_minutes', type: 'int', nullable: true })
  adjustedMinutes: number;

  @Column({ name: 'adjustment_reason', nullable: true, type: 'text' })
  adjustmentReason: string;

  @Column({ type: 'jsonb', nullable: true })
  inconsistencies: string[];

  @Column({ name: 'is_synced', default: false })
  isSynced: boolean;

  @ManyToOne(() => User, (u) => u.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => ServiceAssignment, (a) => a.id)
  @JoinColumn({ name: 'assignment_id' })
  assignment: ServiceAssignment;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
