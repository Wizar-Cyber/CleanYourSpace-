import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany, Index,
} from 'typeorm';
import { ChecklistTemplate } from './checklist-template.entity';
import { ServiceChecklistItem } from './checklist-item.entity';

@Entity('checklist_template_items')
@Index(['templateId', 'order'])
export class ChecklistTemplateItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_id' })
  templateId: string;

  @Column({ length: 300 })
  label: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ default: false })
  required: boolean;

  @Column({ name: 'requires_photo', default: false })
  requiresPhoto: boolean;

  @Column({ name: 'max_photos', type: 'int', default: 5 })
  maxPhotos: number;

  @Column({ nullable: true, length: 100 })
  category: string;

  @ManyToOne(() => ChecklistTemplate, (t) => t.items)
  @JoinColumn({ name: 'template_id' })
  template: ChecklistTemplate;

  @OneToMany(() => ServiceChecklistItem, (s) => s.templateItem)
  serviceItems: ServiceChecklistItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
