import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { ServiceAssignment } from '../assignments/assignment.entity';

@Entity('location_logs')
@Index(['userId', 'assignmentId'])
@Index(['timestamp'])
export class LocationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'assignment_id', nullable: true })
  assignmentId: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  accuracy: number;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ name: 'is_within_radius', nullable: true })
  isWithinRadius: boolean;

  @Column({ name: 'is_synced', default: false })
  isSynced: boolean;

  @ManyToOne(() => User, (u) => u.locationLogs)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => ServiceAssignment, (a) => a.locationLogs)
  @JoinColumn({ name: 'assignment_id' })
  assignment: ServiceAssignment;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
