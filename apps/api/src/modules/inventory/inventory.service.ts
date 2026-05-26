import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere, Like, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { SupplyItem, SupplyCategory } from './supply-item.entity';
import { InventoryTransaction, TransactionType } from './inventory-transaction.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.entity';
import { CreateSupplyItemDto, UpdateSupplyItemDto, CreateInventoryTransactionDto } from '@corecon/types';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(SupplyItem)
    private readonly supplyRepository: Repository<SupplyItem>,
    @InjectRepository(InventoryTransaction)
    private readonly transactionRepository: Repository<InventoryTransaction>,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  // ── RF-076: Supply Catalog ──

  async findAllSupplies(query: {
    category?: string;
    lowStock?: boolean;
    search?: string;
    page: number;
    limit: number;
  }) {
    const where: FindOptionsWhere<SupplyItem> = {};

    if (query.category) where.category = query.category as SupplyCategory;
    if (query.search) where.name = Like(`%${query.search}%`);

    const [data, total] = await this.supplyRepository.findAndCount({
      where,
      order: { name: 'ASC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    let result = data;
    if (query.lowStock) {
      result = data.filter((item) => Number(item.currentStock) <= item.stockMin);
    }

    return {
      data: result,
      meta: { total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async findSupplyById(id: string) {
    const item = await this.supplyRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Supply item not found');
    return item;
  }

  async createSupply(dto: CreateSupplyItemDto, userId: string) {
    const item = this.supplyRepository.create({
      name: dto.name,
      category: dto.category as SupplyCategory,
      unitOfMeasure: dto.unitOfMeasure,
      stockMin: dto.stockMin,
      currentStock: dto.currentStock,
      supplier: dto.supplier || null,
      sku: dto.sku || null,
    } as SupplyItem);

    const saved = await this.supplyRepository.save(item);

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'supply_item',
      entityId: saved.id,
      newValues: { name: saved.name, category: saved.category },
    });

    return saved;
  }

  async updateSupply(id: string, dto: UpdateSupplyItemDto, userId: string) {
    const item = await this.findSupplyById(id);

    if (dto.name !== undefined) item.name = dto.name;
    if (dto.category !== undefined) item.category = dto.category as SupplyCategory;
    if (dto.unitOfMeasure !== undefined) item.unitOfMeasure = dto.unitOfMeasure;
    if (dto.stockMin !== undefined) item.stockMin = dto.stockMin;
    if (dto.currentStock !== undefined) item.currentStock = dto.currentStock;
    if (dto.supplier !== undefined) item.supplier = dto.supplier ?? null;
    if (dto.sku !== undefined) item.sku = dto.sku ?? null;
    if (dto.isActive !== undefined) item.isActive = dto.isActive;

    const saved = await this.supplyRepository.save(item);

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'supply_item',
      entityId: saved.id,
      newValues: { name: saved.name, currentStock: saved.currentStock },
    });

    return saved;
  }

  async removeSupply(id: string) {
    await this.supplyRepository.delete(id);
    return { message: 'Supply item deleted' };
  }

  // ── RF-077: Stock Transactions ──

  async createTransaction(dto: CreateInventoryTransactionDto, userId: string) {
    const item = await this.findSupplyById(dto.supplyItemId);

    const previousStock = Number(item.currentStock);
    let newStock: number;

    switch (dto.type) {
      case TransactionType.IN:
        newStock = previousStock + dto.quantity;
        break;
      case TransactionType.OUT:
        if (dto.quantity > previousStock) {
          throw new BadRequestException(`Insufficient stock. Available: ${previousStock} ${item.unitOfMeasure}`);
        }
        newStock = previousStock - dto.quantity;
        break;
      case TransactionType.ADJUSTMENT:
        newStock = dto.quantity;
        break;
      default:
        throw new BadRequestException('Invalid transaction type');
    }

    const transaction = this.transactionRepository.create({
      supplyItemId: dto.supplyItemId,
      type: dto.type as TransactionType,
      quantity: dto.quantity,
      previousStock,
      newStock,
      reference: dto.reference || null,
      serviceId: dto.serviceId || null,
      contractorId: dto.contractorId || null,
      notes: dto.notes || null,
      createdBy: userId,
    } as InventoryTransaction);

    const saved = await this.transactionRepository.save(transaction);

    item.currentStock = newStock;
    await this.supplyRepository.save(item);

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'inventory_transaction',
      entityId: saved.id,
      newValues: { supplyItemId: dto.supplyItemId, type: dto.type, quantity: dto.quantity, newStock },
    });

    // ── RF-078: Check low stock after transaction ──
    if (newStock <= item.stockMin) {
      const admins = await this.supplyRepository.manager
        .createQueryBuilder()
        .select('u.id')
        .from('users', 'u')
        .where("u.role IN ('super_admin', 'manager')")
        .execute();

      for (const admin of admins) {
        await this.notificationsService.notifyStockAlert(admin.id, item.name, newStock, item.stockMin);
      }
    }

    return saved;
  }

  async findTransactions(query: {
    supplyItemId?: string;
    type?: string;
    from?: string;
    to?: string;
    page: number;
    limit: number;
  }) {
    const where: FindOptionsWhere<InventoryTransaction> = {};

    if (query.supplyItemId) where.supplyItemId = query.supplyItemId;
    if (query.type) where.type = query.type as TransactionType;
    if (query.from && query.to) {
      where.createdAt = Between(new Date(query.from), new Date(query.to)) as any;
    } else if (query.from) {
      where.createdAt = MoreThanOrEqual(new Date(query.from)) as any;
    } else if (query.to) {
      where.createdAt = LessThanOrEqual(new Date(query.to)) as any;
    }

    const [data, total] = await this.transactionRepository.findAndCount({
      where,
      relations: ['supplyItem', 'service', 'contractor'],
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return {
      data,
      meta: { total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) },
    };
  }

  // ── RF-078: Low Stock Alerts ──

  async getLowStockItems() {
    const items = await this.supplyRepository.find({
      where: { isActive: true },
    });

    return items
      .filter((item) => Number(item.currentStock) <= item.stockMin)
      .map((item) => ({
        supplyItemId: item.id,
        supplyName: item.name,
        category: item.category,
        currentStock: Number(item.currentStock),
        stockMin: item.stockMin,
        unitOfMeasure: item.unitOfMeasure,
      }));
  }

  // ── RF-079: Consumption Report ──

  async getConsumptionReport(from: string, to: string, filters?: {
    contractorId?: string;
    serviceId?: string;
    supplyItemId?: string;
  }) {
    const where: FindOptionsWhere<InventoryTransaction> = {
      type: TransactionType.OUT,
      createdAt: Between(new Date(from), new Date(to)),
    };

    if (filters?.contractorId) where.contractorId = filters.contractorId;
    if (filters?.serviceId) where.serviceId = filters.serviceId;
    if (filters?.supplyItemId) where.supplyItemId = filters.supplyItemId;

    const transactions = await this.transactionRepository.find({
      where,
      relations: ['supplyItem'],
    });

    const byItem = new Map<string, { name: string; category: string; uom: string; total: number; count: number }>();

    for (const t of transactions) {
      if (!t.supplyItem) continue;
      const existing = byItem.get(t.supplyItemId) || {
        name: t.supplyItem.name,
        category: t.supplyItem.category,
        uom: t.supplyItem.unitOfMeasure,
        total: 0,
        count: 0,
      };
      existing.total += Number(t.quantity);
      existing.count++;
      byItem.set(t.supplyItemId, existing);
    }

    const entries = Array.from(byItem.entries()).map(([supplyItemId, data]) => ({
      supplyItemId,
      supplyName: data.name,
      category: data.category,
      totalConsumed: Math.round(data.total * 100) / 100,
      unitOfMeasure: data.uom,
      transactions: data.count,
    }));

    return {
      period: { from, to },
      entries,
      totalItems: entries.length,
      grandTotalConsumed: Math.round(entries.reduce((s, e) => s + e.totalConsumed, 0) * 100) / 100,
    };
  }
}
