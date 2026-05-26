import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { ServiceAssignment } from '../assignments/assignment.entity';
import { ChecklistTemplateItem } from './checklist-template-item.entity';

export enum ChecklistItemStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  NA = 'na',
}

@Entity('service_checklist_items')
@Index(['assignmentId', 'templateItemId'], { unique: true })
export class ServiceChecklistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'assignment_id' })
  assignmentId: string;

  @Column({ name: 'template_item_id' })
  templateItemId: string;

  @Column({ type: 'enum', enum: ChecklistItemStatus, default: ChecklistItemStatus.PENDING })
  status: ChecklistItemStatus;

  @Column({ name: 'completed_at', nullable: true, type: 'timestamp' })
  completedAt: Date;

  @Column({ name: 'completed_by', nullable: true })
  completedBy: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'photo_id', nullable: true })
  photoId: string;

  @ManyToOne(() => ServiceAssignment, (a) => a.checklistItems)
  @JoinColumn({ name: 'assignment_id' })
  assignment: ServiceAssignment;

  @ManyToOne(() => ChecklistTemplateItem, (t) => t.serviceItems)
  @JoinColumn({ name: 'template_item_id' })
  templateItem: ChecklistTemplateItem;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
