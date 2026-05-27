import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { SupplyItem, SupplyCategory } from './supply-item.entity';
import { InventoryTransaction, TransactionType } from './inventory-transaction.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let supplyRepository: any;
  let transactionRepository: any;
  let notificationsService: any;
  let auditService: any;

  const mockSupplyItem: any = {
    id: 'supply-uuid-1',
    name: 'All-Purpose Cleaner',
    category: SupplyCategory.CHEMICAL,
    unitOfMeasure: 'gal',
    stockMin: 5,
    currentStock: 10,
    supplier: 'CleanCo',
    sku: 'APC-001',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction: any = {
    id: 'tx-uuid-1',
    supplyItemId: 'supply-uuid-1',
    type: TransactionType.IN,
    quantity: 5,
    previousStock: 10,
    newStock: 15,
    reference: 'PO-123',
    notes: 'Restock',
    createdBy: 'user-uuid-1',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(SupplyItem),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            manager: {
              createQueryBuilder: jest.fn(() => ({
                select: jest.fn().mockReturnThis(),
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                execute: jest.fn().mockResolvedValue([]),
              })),
            },
          },
        },
        {
          provide: getRepositoryToken(InventoryTransaction),
          useValue: {
            find: jest.fn(),
            findAndCount: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            notifyStockAlert: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    supplyRepository = module.get(getRepositoryToken(SupplyItem));
    transactionRepository = module.get(getRepositoryToken(InventoryTransaction));
    notificationsService = module.get(NotificationsService);
    auditService = module.get(AuditService);
  });

  describe('findAllSupplies', () => {
    it('should return paginated supplies', async () => {
      supplyRepository.findAndCount.mockResolvedValue([[mockSupplyItem], 1]);

      const result = await service.findAllSupplies({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by category', async () => {
      supplyRepository.findAndCount.mockResolvedValue([[mockSupplyItem], 1]);

      await service.findAllSupplies({ page: 1, limit: 20, category: 'chemical' });

      expect(supplyRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: SupplyCategory.CHEMICAL }),
        }),
      );
    });

    it('should filter by low stock', async () => {
      const lowStockItem = { ...mockSupplyItem, currentStock: 3, stockMin: 5 };
      supplyRepository.findAndCount.mockResolvedValue([[lowStockItem], 1]);

      const result = await service.findAllSupplies({ page: 1, limit: 20, lowStock: true });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('findSupplyById', () => {
    it('should return supply item by id', async () => {
      supplyRepository.findOne.mockResolvedValue(mockSupplyItem);

      const result = await service.findSupplyById('supply-uuid-1');

      expect(result.id).toBe('supply-uuid-1');
      expect(result.name).toBe('All-Purpose Cleaner');
    });

    it('should throw NotFoundException for non-existent id', async () => {
      supplyRepository.findOne.mockResolvedValue(null);

      await expect(service.findSupplyById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createSupply', () => {
    it('should create a supply item successfully', async () => {
      supplyRepository.create.mockReturnValue(mockSupplyItem);
      supplyRepository.save.mockResolvedValue(mockSupplyItem);

      const result = await service.createSupply(
        {
          name: 'All-Purpose Cleaner',
          category: 'chemical',
          unitOfMeasure: 'gal',
          stockMin: 5,
          currentStock: 10,
        },
        'user-uuid-1',
      );

      expect(result.name).toBe('All-Purpose Cleaner');
      expect(auditService.log).toHaveBeenCalled();
    });
  });

  describe('updateSupply', () => {
    it('should update a supply item', async () => {
      supplyRepository.findOne.mockResolvedValue(mockSupplyItem);
      supplyRepository.save.mockResolvedValue({ ...mockSupplyItem, name: 'Updated Cleaner' });

      const result = await service.updateSupply(
        'supply-uuid-1',
        { name: 'Updated Cleaner' },
        'user-uuid-1',
      );

      expect(result.name).toBe('Updated Cleaner');
    });

    it('should throw NotFoundException for non-existent item', async () => {
      supplyRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateSupply('non-existent', { name: 'Test' }, 'user-uuid-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeSupply', () => {
    it('should delete a supply item', async () => {
      supplyRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.removeSupply('supply-uuid-1');

      expect(result.message).toBe('Supply item deleted');
    });
  });

  describe('createTransaction', () => {
    it('should process an IN transaction', async () => {
      supplyRepository.findOne.mockResolvedValue(mockSupplyItem);
      transactionRepository.create.mockReturnValue(mockTransaction);
      transactionRepository.save.mockResolvedValue(mockTransaction);
      supplyRepository.save.mockResolvedValue({ ...mockSupplyItem, currentStock: 15 });

      const result = await service.createTransaction(
        { supplyItemId: 'supply-uuid-1', type: 'in', quantity: 5 },
        'user-uuid-1',
      );

      expect(result.newStock).toBe(15);
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should process an OUT transaction', async () => {
      const item = { ...mockSupplyItem, currentStock: 10 };
      const outTx = { ...mockTransaction, type: TransactionType.OUT, newStock: 5 };
      supplyRepository.findOne.mockResolvedValue(item);
      transactionRepository.create.mockReturnValue(outTx);
      transactionRepository.save.mockResolvedValue(outTx);
      supplyRepository.save.mockResolvedValue({ ...item, currentStock: 5 });

      const result = await service.createTransaction(
        { supplyItemId: 'supply-uuid-1', type: 'out', quantity: 5 },
        'user-uuid-1',
      );

      expect(result.newStock).toBe(5);
    });

    it('should throw BadRequestException for insufficient stock', async () => {
      supplyRepository.findOne.mockResolvedValue(mockSupplyItem);

      await expect(
        service.createTransaction(
          { supplyItemId: 'supply-uuid-1', type: 'out', quantity: 100 },
          'user-uuid-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should process an ADJUSTMENT transaction', async () => {
      supplyRepository.findOne.mockResolvedValue(mockSupplyItem);
      transactionRepository.create.mockReturnValue(mockTransaction);
      transactionRepository.save.mockResolvedValue({ ...mockTransaction, newStock: 25, quantity: 25 });
      supplyRepository.save.mockResolvedValue({ ...mockSupplyItem, currentStock: 25 });

      const result = await service.createTransaction(
        { supplyItemId: 'supply-uuid-1', type: 'adjustment', quantity: 25 },
        'user-uuid-1',
      );

      expect(result.newStock).toBe(25);
    });

    it('should trigger low stock alert when stock falls below min', async () => {
      const lowItem = { ...mockSupplyItem, currentStock: 5, stockMin: 10 };
      supplyRepository.findOne.mockResolvedValue(lowItem);
      transactionRepository.create.mockReturnValue({ ...mockTransaction, newStock: 3 });
      transactionRepository.save.mockResolvedValue({ ...mockTransaction, newStock: 3 });
      supplyRepository.save.mockResolvedValue({ ...lowItem, currentStock: 3 });
      supplyRepository.manager.createQueryBuilder.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue([{ id: 'admin-uuid-1' }]),
      });

      await service.createTransaction(
        { supplyItemId: 'supply-uuid-1', type: 'out', quantity: 2 },
        'user-uuid-1',
      );

      expect(notificationsService.notifyStockAlert).toHaveBeenCalled();
    });
  });

  describe('findTransactions', () => {
    it('should return paginated transactions', async () => {
      transactionRepository.findAndCount.mockResolvedValue([[mockTransaction], 1]);

      const result = await service.findTransactions({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by supplyItemId', async () => {
      transactionRepository.findAndCount.mockResolvedValue([[mockTransaction], 1]);

      await service.findTransactions({ page: 1, limit: 20, supplyItemId: 'supply-uuid-1' });

      expect(transactionRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ supplyItemId: 'supply-uuid-1' }),
        }),
      );
    });
  });

  describe('getLowStockItems', () => {
    it('should return items where current stock <= min stock', async () => {
      const lowItem = { ...mockSupplyItem, currentStock: 3, stockMin: 5 };
      const okItem = { ...mockSupplyItem, id: 'supply-uuid-2', currentStock: 20, stockMin: 5 };
      supplyRepository.find.mockResolvedValue([lowItem, okItem]);

      const result = await service.getLowStockItems();

      expect(result).toHaveLength(1);
      expect(result[0].supplyItemId).toBe('supply-uuid-1');
    });
  });

  describe('getConsumptionReport', () => {
    it('should generate consumption report', async () => {
      const outTx = {
        ...mockTransaction,
        type: TransactionType.OUT,
        quantity: 3,
        supplyItem: mockSupplyItem,
      };
      transactionRepository.find.mockResolvedValue([outTx]);

      const result = await service.getConsumptionReport('2026-01-01', '2026-12-31');

      expect(result.entries).toHaveLength(1);
      expect(result.grandTotalConsumed).toBe(3);
    });
  });
});
