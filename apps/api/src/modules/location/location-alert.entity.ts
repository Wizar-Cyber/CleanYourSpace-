import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { ServiceAssignment } from '../assignments/assignment.entity';

export enum AlertType {
  RADIUS_EXCEEDED = 'radius_exceeded',
  RADIUS_RESTORED = 'radius_restored',
  OFF_ROUTE = 'off_route',
}

@Entity('location_alerts')
@Index(['userId', 'assignmentId'])
@Index(['resolved'])
export class LocationAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'assignment_id' })
  assignmentId: string;

  @Column({ type: 'enum', enum: AlertType })
  type: AlertType;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ name: 'expected_latitude', type: 'decimal', precision: 10, scale: 7 })
  expectedLatitude: number;

  @Column({ name: 'expected_longitude', type: 'decimal', precision: 10, scale: 7 })
  expectedLongitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  distance: number;

  @Column({ default: false })
  resolved: boolean;

  @Column({ name: 'grace_ends_at', nullable: true, type: 'timestamp' })
  graceEndsAt: Date;

  @Column({ name: 'alert_sent_at', nullable: true, type: 'timestamp' })
  alertSentAt: Date;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy: string;

  @Column({ name: 'reviewed_at', nullable: true, type: 'timestamp' })
  reviewedAt: Date;

  @Column({ name: 'resolved_at', nullable: true, type: 'timestamp' })
  resolvedAt: Date;

  @ManyToOne(() => User, (u) => u.locationAlerts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => ServiceAssignment, (a) => a.locationAlerts)
  @JoinColumn({ name: 'assignment_id' })
  assignment: ServiceAssignment;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
