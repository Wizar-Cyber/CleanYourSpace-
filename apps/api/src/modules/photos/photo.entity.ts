import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { ServiceAssignment } from '../assignments/assignment.entity';
import { User } from '../users/user.entity';

export enum PhotoCategory {
  BEFORE = 'before',
  AFTER = 'after',
  CHECKLIST = 'checklist',
}

export enum PhotoStatus {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('photos')
@Index(['assignmentId', 'category'])
@Index(['serviceId'])
export class Photo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'assignment_id' })
  assignmentId: string;

  @Column({ name: 'service_id', nullable: true })
  serviceId: string;

  @Column({ name: 'checklist_item_id', nullable: true })
  checklistItemId: string;

  @Column({ name: 'uploaded_by' })
  uploadedBy: string;

  @Column({ type: 'enum', enum: PhotoCategory })
  category: PhotoCategory;

  @Column({ length: 50, nullable: true, name: 'type' })
  type: string;

  @Column({ type: 'enum', enum: PhotoStatus, default: PhotoStatus.PENDING })
  status: PhotoStatus;

  @Column({ length: 500 })
  filename: string;

  @Column({ name: 'original_name', length: 500 })
  originalName: string;

  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @Column({ type: 'int' })
  size: number;

  @Column({ name: 'file_path', nullable: true })
  filePath: string;

  @Column({ name: 'file_size_kb', type: 'decimal', precision: 10, scale: 2, nullable: true })
  fileSizeKb: number;

  @Column({ name: 'compressed_size', type: 'int', nullable: true })
  compressedSize: number;

  @Column({ nullable: true })
  url: string;

  @Column({ name: 'thumbnail_url', nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ name: 'taken_at', nullable: true, type: 'timestamp' })
  takenAt: Date;

  @Column({ name: 'uploaded_at', nullable: true, type: 'timestamp' })
  uploadedAt: Date;

  @Column({ name: 'is_synced', default: false })
  isSynced: boolean;

  @ManyToOne(() => ServiceAssignment, (a) => a.photos)
  @JoinColumn({ name: 'assignment_id' })
  assignment: ServiceAssignment;

  @ManyToOne(() => User, (u) => u.photos)
  @JoinColumn({ name: 'uploaded_by' })
  uploadedByUser: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
