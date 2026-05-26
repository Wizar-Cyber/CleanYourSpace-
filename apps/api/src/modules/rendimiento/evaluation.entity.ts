import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { ServiceAssignment } from '../assignments/assignment.entity';

@Entity('supervisor_evaluations')
@Index(['contractorId'])
@Index(['assignmentId'])
@Index(['evaluatedBy'])
export class SupervisorEvaluation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contractor_id' })
  contractorId: string;

  @Column({ name: 'assignment_id' })
  assignmentId: string;

  @Column({ name: 'evaluated_by' })
  evaluatedBy: string;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ name: 'service_type', length: 100, nullable: true })
  serviceType: string;

  @ManyToOne(() => User, (u) => u.id)
  @JoinColumn({ name: 'contractor_id' })
  contractor: User;

  @ManyToOne(() => User, (u) => u.id)
  @JoinColumn({ name: 'evaluated_by' })
  evaluator: User;

  @ManyToOne(() => ServiceAssignment, (a) => a.id)
  @JoinColumn({ name: 'assignment_id' })
  assignment: ServiceAssignment;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
