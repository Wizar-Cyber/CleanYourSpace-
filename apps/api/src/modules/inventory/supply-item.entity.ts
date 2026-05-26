import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToMany, Index,
} from 'typeorm';
import { InventoryTransaction } from './inventory-transaction.entity';

export enum SupplyCategory {
  CHEMICAL = 'chemical',
  TOOL = 'tool',
  PPE = 'ppe',
  PAPER = 'paper',
  BAG = 'bag',
  OTHER = 'other',
}

@Entity('supply_items')
@Index(['category'])
@Index(['isActive'])
export class SupplyItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'enum', enum: SupplyCategory })
  category: SupplyCategory;

  @Column({ name: 'unit_of_measure', length: 50 })
  unitOfMeasure: string;

  @Column({ name: 'stock_min', type: 'int', default: 5 })
  stockMin: number;

  @Column({ name: 'current_stock', type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentStock: number;

  @Column({ name: 'supplier', length: 200, nullable: true })
  supplier: string | null;

  @Column({ nullable: true, length: 100 })
  sku: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => InventoryTransaction, (t) => t.supplyItem)
  transactions: InventoryTransaction[];
}
