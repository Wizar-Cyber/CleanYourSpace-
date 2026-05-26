import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum DocumentCategory {
  CONTRACT = 'contract',
  ID = 'id',
  CERTIFICATION = 'certification',
  OTHER = 'other',
}

@Entity('documents')
@Index(['userId'])
@Index(['category'])
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: DocumentCategory })
  category: DocumentCategory;

  @Column({ length: 500 })
  filename: string;

  @Column({ name: 'original_name', length: 500 })
  originalName: string;

  @Column({ name: 'mime_type', length: 100 })
  mimeType: string;

  @Column({ type: 'int' })
  size: number;

  @Column()
  url: string;

  @ManyToOne(() => User, (u) => u.documents)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;
}
