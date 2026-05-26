import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToMany, Index,
} from 'typeorm';
import { ServiceAssignment } from '../assignments/assignment.entity';
import { LocationLog } from '../location/location-log.entity';
import { LocationAlert } from '../location/location-alert.entity';
import { Photo } from '../photos/photo.entity';
import { Notification } from '../notifications/notification.entity';
import { Document } from '../documents/document.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  MANAGER = 'manager',
  SUPERVISOR = 'supervisor',
  CONTRACTOR = 'contractor',
  CLIENT = 'client',
}

export enum ContractType {
  W2 = 'w2',
  CONTRACTOR_1099 = 'contractor_1099',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'first_name', length: 50 })
  firstName: string;

  @Column({ name: 'last_name', length: 50 })
  lastName: string;

  @Column({ nullable: true, length: 20 })
  phone: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'photo_url', nullable: true })
  photoUrl: string;

  @Column({ length: 10, default: 'en' })
  language: string;

  @Column({ name: 'hourly_rate', type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate: number;

  @Column({ name: 'contract_type', type: 'enum', enum: ContractType, nullable: true })
  contractType: ContractType;

  @Column({ name: 'must_change_password', default: false })
  mustChangePassword: boolean;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ nullable: true, type: 'text' })
  refreshToken: string;

  @Column({ name: 'reset_password_token', nullable: true, type: 'text' })
  resetPasswordToken: string;

  @Column({ name: 'reset_password_expires', nullable: true, type: 'timestamp' })
  resetPasswordExpires: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ServiceAssignment, (a) => a.cleaner)
  assignments: ServiceAssignment[];

  @OneToMany(() => LocationLog, (l) => l.user)
  locationLogs: LocationLog[];

  @OneToMany(() => LocationAlert, (l) => l.user)
  locationAlerts: LocationAlert[];

  @OneToMany(() => Photo, (p) => p.uploadedBy)
  photos: Photo[];

  @OneToMany(() => Notification, (n) => n.user)
  notifications: Notification[];

  @OneToMany(() => Document, (d) => d.user)
  documents: Document[];
}
