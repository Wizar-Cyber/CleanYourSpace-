import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

export enum ReportType {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
}

@Entity('reports')
@Index(['type', 'createdAt'])
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ReportType })
  type: ReportType;

  @Column({ type: 'enum', enum: ReportFormat })
  format: ReportFormat;

  @Column({ name: 'generated_by' })
  generatedBy: string;

  @Column({ nullable: true })
  url: string;

  @Column({ name: 'file_path_pdf', nullable: true })
  filePathPdf: string;

  @Column({ name: 'file_path_xlsx', nullable: true })
  filePathXlsx: string;

  @Column({ length: 500 })
  filename: string;

  @Column({ name: 'date_from', type: 'date' })
  dateFrom: Date;

  @Column({ name: 'date_to', type: 'date' })
  dateTo: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
