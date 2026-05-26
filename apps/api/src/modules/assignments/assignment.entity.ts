import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany, Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Service } from '../services/service.entity';
import { ServiceChecklistItem } from '../checklist/checklist-item.entity';
import { Photo } from '../photos/photo.entity';
import { LocationLog } from '../location/location-log.entity';
import { LocationAlert } from '../location/location-alert.entity';

export enum AssignmentStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  PENDING_VERIFICATION = 'pending_verification',
  COMPLETED = 'completed',
  RETURNED = 'returned',
  CANCELLED = 'cancelled',
}

@Entity('service_assignments')
@Index(['cleanerId', 'scheduledDate'])
@Index(['status'])
export class ServiceAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'service_id' })
  serviceId: string;

  @Column({ name: 'cleaner_id' })
  cleanerId: string;

  @Column({ name: 'scheduled_date', type: 'date' })
  scheduledDate: Date;

  @Column({ name: 'scheduled_start_time', type: 'time' })
  scheduledStartTime: string;

  @Column({ name: 'scheduled_end_time', type: 'time' })
  scheduledEndTime: string;

  @Column({ type: 'enum', enum: AssignmentStatus, default: AssignmentStatus.PENDING })
  status: AssignmentStatus;

  @Column({ name: 'timer_start', nullable: true, type: 'timestamp' })
  timerStart: Date;

  @Column({ name: 'timer_end', nullable: true, type: 'timestamp' })
  timerEnd: Date;

  @Column({ name: 'total_minutes', type: 'int', nullable: true })
  totalMinutes: number;

  @Column({ name: 'hourly_rate_snapshot', type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRateSnapshot: number;

  @Column({ name: 'payment_calculated', type: 'decimal', precision: 10, scale: 2, nullable: true })
  paymentCalculated: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'started_at', nullable: true, type: 'timestamp' })
  startedAt: Date;

  @Column({ name: 'completed_at', nullable: true, type: 'timestamp' })
  completedAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @ManyToOne(() => User, (u) => u.assignments)
  @JoinColumn({ name: 'cleaner_id' })
  cleaner: User;

  @ManyToOne(() => Service, (s) => s.assignments)
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @OneToMany(() => ServiceChecklistItem, (c) => c.assignment)
  checklistItems: ServiceChecklistItem[];

  @OneToMany(() => Photo, (p) => p.assignment)
  photos: Photo[];

  @OneToMany(() => LocationLog, (l) => l.assignment)
  locationLogs: LocationLog[];

  @OneToMany(() => LocationAlert, (l) => l.assignment)
  locationAlerts: LocationAlert[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
