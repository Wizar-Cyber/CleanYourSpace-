import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index, Unique,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum ScorePeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
}

@Entity('performance_scores')
@Unique(['contractorId', 'period', 'periodStart'])
@Index(['contractorId', 'period'])
@Index(['period', 'periodStart'])
export class PerformanceScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contractor_id' })
  contractorId: string;

  @Column({ type: 'enum', enum: ScorePeriod })
  period: ScorePeriod;

  @Column({ name: 'period_start', type: 'date' })
  periodStart: Date;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd: Date;

  @Column({ name: 'attendance_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  attendanceRate: number;

  @Column({ name: 'punctuality_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  punctualityRate: number;

  @Column({ name: 'avg_time_variance', type: 'decimal', precision: 5, scale: 2, nullable: true })
  avgTimeVariance: number;

  @Column({ name: 'quality_score', type: 'decimal', precision: 5, scale: 2, default: 0 })
  qualityScore: number;

  @Column({ name: 'checklist_completion_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  checklistCompletionRate: number;

  @Column({ name: 'incident_count', type: 'int', default: 0 })
  incidentCount: number;

  @Column({ name: 'services_completed', type: 'int', default: 0 })
  servicesCompleted: number;

  @Column({ name: 'total_hours', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalHours: number;

  @Column({ name: 'avg_evaluation_score', type: 'decimal', precision: 4, scale: 2, nullable: true })
  avgEvaluationScore: number;

  @Column({ name: 'evaluation_count', type: 'int', default: 0 })
  evaluationCount: number;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, unknown>;

  @ManyToOne(() => User, (u) => u.id)
  @JoinColumn({ name: 'contractor_id' })
  contractor: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
