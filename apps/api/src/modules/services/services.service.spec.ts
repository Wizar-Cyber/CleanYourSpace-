import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ServicesService } from './services.service';
import { Service, ServiceStatus } from './service.entity';
import { ServiceType } from './service-type.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { AssignmentsService } from '../assignments/assignments.service';

describe('ServicesService', () => {
  let service: ServicesService;
  let repository: jest.Mocked<Repository<Service>>;

  const mockService: any = {
    id: 'uuid-123',
    name: 'Deep Cleaning',
    description: 'Full deep cleaning service',
    duration: 120,
    price: 150,
    isActive: true,
    clientName: 'John Doe',
    address: '123 Main St',
    latitude: null,
    longitude: null,
    scheduledAt: new Date(),
    serviceType: 'deep',
    status: ServiceStatus.SCHEDULED,
    rejectionNote: null,
    verifiedBy: null,
    verifiedAt: null,
    checklistTemplateId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignments: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getRepositoryToken(Service),
          useValue: {
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
            manager: {
              getRepository: jest.fn(() => ({
                find: jest.fn(),
              })),
            },
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ServiceType),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: AssignmentsService,
          useValue: {
            findByService: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    repository = module.get(getRepositoryToken(Service)) as jest.Mocked<Repository<Service>>;
  });

  it('should find all services with pagination', async () => {
    repository.findAndCount.mockResolvedValue([[mockService], 1]);

    const result = await service.findAll(1, 10);

    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.meta.page).toBe(1);
  });

  it('should find service by id', async () => {
    repository.findOne.mockResolvedValue(mockService);

    const result = await service.findById('uuid-123');

    expect(result).toBeDefined();
    expect(result.name).toBe('Deep Cleaning');
  });

  it('should throw NotFoundException for non-existent service', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
  });

  it('should create a new service', async () => {
    const dto = {
      name: 'Deep Cleaning',
      duration: 120,
      price: 150,
      clientName: 'John Doe',
      address: '123 Main St',
      scheduledAt: new Date().toISOString(),
      serviceType: 'deep',
    };
    const created: any = { ...mockService, ...dto, scheduledAt: new Date(dto.scheduledAt) };
    repository.create.mockReturnValue(created);
    repository.save.mockResolvedValue(created);
    repository.findOne.mockResolvedValue(created);

    const result: any = await service.create(dto as any);

    expect(result).toBeDefined();
    expect(result.name).toBe('Deep Cleaning');
  });

  it('should throw ForbiddenException when updating a completed service', async () => {
    const completedService = { ...mockService, status: ServiceStatus.COMPLETED };
    repository.findOne.mockResolvedValue(completedService);

    await expect(service.update('uuid-123', { clientName: 'Updated' })).rejects.toThrow(ForbiddenException);
  });
});
