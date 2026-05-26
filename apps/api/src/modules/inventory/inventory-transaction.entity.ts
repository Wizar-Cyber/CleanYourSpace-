import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { SupplyItem } from './supply-item.entity';
import { Service } from '../services/service.entity';
import { User } from '../users/user.entity';

export enum TransactionType {
  IN = 'in',
  OUT = 'out',
  ADJUSTMENT = 'adjustment',
}

@Entity('inventory_transactions')
@Index(['supplyItemId'])
@Index(['serviceId'])
@Index(['contractorId'])
@Index(['createdAt'])
export class InventoryTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'supply_item_id' })
  supplyItemId: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ name: 'previous_stock', type: 'decimal', precision: 10, scale: 2 })
  previousStock: number;

  @Column({ name: 'new_stock', type: 'decimal', precision: 10, scale: 2 })
  newStock: number;

  @Column({ nullable: true, length: 200 })
  reference: string;

  @Column({ name: 'service_id', nullable: true })
  serviceId: string;

  @Column({ name: 'contractor_id', nullable: true })
  contractorId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => SupplyItem, (s) => s.transactions)
  @JoinColumn({ name: 'supply_item_id' })
  supplyItem: SupplyItem;

  @ManyToOne(() => Service, { nullable: true })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'contractor_id' })
  contractor: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
