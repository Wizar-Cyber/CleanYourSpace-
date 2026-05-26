import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AssignmentsService } from './assignments.service';
import { ServiceAssignment, AssignmentStatus } from './assignment.entity';
import { Service } from '../services/service.entity';
import { User, UserRole } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('AssignmentsService', () => {
  let service: AssignmentsService;
  let assignmentRepository: jest.Mocked<Repository<ServiceAssignment>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let notificationsService: jest.Mocked<NotificationsService>;

  const mockUser: User = {
    id: 'cleaner-uuid',
    email: 'cleaner@corecon.us',
    passwordHash: 'hash',
    firstName: 'Cleaner',
    lastName: 'One',
    role: UserRole.CLEANER,
    isActive: true,
    phone: null,
    photoUrl: null,
    language: 'en',
    hourlyRate: 25,
    mustChangePassword: false,
    createdBy: null,
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignments: [],
    locationLogs: [],
    locationAlerts: [],
    photos: [],
    notifications: [],
  } as unknown as User;

  const mockService: Service = {
    id: 'service-uuid',
    name: 'Deep Cleaning',
    description: 'Full cleaning',
    duration: 120,
    price: 150,
    isActive: true,
    clientName: 'John Doe',
    address: '123 Main St',
    latitude: null,
    longitude: null,
    scheduledAt: new Date(),
    serviceType: 'deep',
    status: 'pending' as any,
    rejectionNote: null,
    verifiedBy: null,
    verifiedAt: null,
    checklistTemplateId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignments: [],
  } as unknown as Service;

  const mockAssignment: ServiceAssignment = {
    id: 'assignment-uuid',
    serviceId: 'service-uuid',
    cleanerId: 'cleaner-uuid',
    scheduledDate: new Date('2025-01-15') as any,
    scheduledStartTime: '09:00',
    scheduledEndTime: '11:00',
    status: AssignmentStatus.PENDING,
    timerStart: null as any,
    timerEnd: null as any,
    totalMinutes: null as any,
    hourlyRateSnapshot: null as any,
    paymentCalculated: null as any,
    notes: null as any,
    startedAt: null as any,
    completedAt: null as any,
    latitude: null as any,
    longitude: null as any,
    cleaner: mockUser,
    service: mockService,
    checklistItems: [],
    photos: [],
    locationLogs: [],
    locationAlerts: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as ServiceAssignment;

  const mockQueryBuilder: any = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[mockAssignment], 1]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        {
          provide: getRepositoryToken(ServiceAssignment),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
            manager: {
              getRepository: jest.fn(() => ({
                update: jest.fn(),
              })),
            },
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            create: jest.fn().mockResolvedValue({}),
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

    service = module.get<AssignmentsService>(AssignmentsService);
    assignmentRepository = module.get(getRepositoryToken(ServiceAssignment)) as jest.Mocked<Repository<ServiceAssignment>>;
    userRepository = module.get(getRepositoryToken(User)) as jest.Mocked<Repository<User>>;
    notificationsService = module.get(NotificationsService) as jest.Mocked<NotificationsService>;
  });

  describe('findAll', () => {
    it('should return paginated assignments', async () => {
      const result = await service.findAll(1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });

    it('should apply status filter', async () => {
      await service.findAll(1, 20, { status: 'pending' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('a.status = :status', { status: 'pending' });
    });

    it('should apply cleanerId filter', async () => {
      await service.findAll(1, 20, { cleanerId: 'cleaner-uuid' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('a.cleanerId = :cleanerId', { cleanerId: 'cleaner-uuid' });
    });
  });

  describe('findById', () => {
    it('should return assignment if found', async () => {
      assignmentRepository.findOne.mockResolvedValue(mockAssignment);

      const result = await service.findById('assignment-uuid');

      expect(result).toBeDefined();
      expect(result.id).toBe('assignment-uuid');
    });

    it('should throw NotFoundException if not found', async () => {
      assignmentRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCleaner', () => {
    it('should return assignments for a cleaner', async () => {
      assignmentRepository.find.mockResolvedValue([mockAssignment]);

      const result = await service.findByCleaner('cleaner-uuid');

      expect(result).toHaveLength(1);
      expect(assignmentRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { cleanerId: 'cleaner-uuid' } }),
      );
    });

    it('should filter by status when provided', async () => {
      assignmentRepository.find.mockResolvedValue([mockAssignment]);

      await service.findByCleaner('cleaner-uuid', 'in_progress');

      expect(assignmentRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { cleanerId: 'cleaner-uuid', status: 'in_progress' } }),
      );
    });
  });

  describe('findTodayByCleaner', () => {
    it('should return today assignments for a cleaner', async () => {
      assignmentRepository.find.mockResolvedValue([mockAssignment]);

      const result = await service.findTodayByCleaner('cleaner-uuid');

      expect(result).toHaveLength(1);
    });
  });

  describe('create', () => {
    it('should create assignment with hourly rate snapshot', async () => {
      const dto = {
        serviceId: 'service-uuid',
        cleanerId: 'cleaner-uuid',
        scheduledDate: new Date().toISOString(),
        scheduledStartTime: '09:00',
        scheduledEndTime: '11:00',
      };
      userRepository.findOne.mockResolvedValue(mockUser);
      assignmentRepository.create.mockReturnValue(mockAssignment);
      assignmentRepository.save.mockResolvedValue(mockAssignment);

      const result = await service.create(dto as any);

      expect(result).toBeDefined();
      expect(assignmentRepository.create).toHaveBeenCalled();
    });

    it('should create assignment without cleaner hourly rate', async () => {
      const dto = {
        serviceId: 'service-uuid',
        cleanerId: 'cleaner-uuid',
        scheduledDate: new Date().toISOString(),
        scheduledStartTime: '09:00',
        scheduledEndTime: '11:00',
      };
      userRepository.findOne.mockResolvedValue(null);
      assignmentRepository.create.mockReturnValue(mockAssignment);
      assignmentRepository.save.mockResolvedValue(mockAssignment);

      const result = await service.create(dto as any);

      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update assignment', async () => {
      assignmentRepository.findOne.mockResolvedValue(mockAssignment);
      assignmentRepository.save.mockResolvedValue({ ...mockAssignment, notes: 'Updated' });

      const result = await service.update('assignment-uuid', { notes: 'Updated' } as any);

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if assignment not found', async () => {
      assignmentRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update assignment status', async () => {
      assignmentRepository.findOne.mockResolvedValue(mockAssignment);
      assignmentRepository.save.mockResolvedValue({ ...mockAssignment, status: AssignmentStatus.ACCEPTED as any });

      const result = await service.updateStatus('assignment-uuid', AssignmentStatus.ACCEPTED, 'cleaner-uuid');

      expect(result.status).toBe(AssignmentStatus.ACCEPTED);
    });

    it('should throw ForbiddenException if not the assigned cleaner', async () => {
      assignmentRepository.findOne.mockResolvedValue(mockAssignment);

      await expect(
        service.updateStatus('assignment-uuid', AssignmentStatus.ACCEPTED, 'other-cleaner'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should set startedAt and timerStart when moving to in_progress', async () => {
      assignmentRepository.findOne.mockResolvedValue(mockAssignment);
      assignmentRepository.save.mockResolvedValue(mockAssignment);

      await service.updateStatus('assignment-uuid', AssignmentStatus.IN_PROGRESS, 'cleaner-uuid');

      expect(notificationsService.create).toHaveBeenCalled();
    });

    it('should calculate payment when moving to pending_verification', async () => {
      const assignmentWithTimer = {
        ...mockAssignment,
        timerStart: new Date(),
        hourlyRateSnapshot: 25,
      };
      assignmentRepository.findOne.mockResolvedValue(assignmentWithTimer);
      assignmentRepository.save.mockResolvedValue(assignmentWithTimer);

      const result = await service.updateStatus(
        'assignment-uuid',
        AssignmentStatus.PENDING_VERIFICATION,
        'cleaner-uuid',
      );

      expect(result.status).toBe(AssignmentStatus.PENDING_VERIFICATION);
    });

    it('should set completedAt when moving to completed', async () => {
      const assignmentInProgress = { ...mockAssignment, status: AssignmentStatus.IN_PROGRESS };
      assignmentRepository.findOne.mockResolvedValue(assignmentInProgress);
      assignmentRepository.save.mockResolvedValue(assignmentInProgress);

      const result = await service.updateStatus('assignment-uuid', AssignmentStatus.COMPLETED, 'cleaner-uuid');

      expect(result.completedAt).toBeDefined();
    });
  });

  describe('startService', () => {
    it('should start service for assigned cleaner', async () => {
      assignmentRepository.findOne.mockResolvedValue(mockAssignment);
      assignmentRepository.save.mockResolvedValue(mockAssignment);

      const result = await service.startService('assignment-uuid', 'cleaner-uuid');

      expect(result.status).toBe(AssignmentStatus.IN_PROGRESS);
      expect(result.startedAt).toBeDefined();
      expect(notificationsService.create).toHaveBeenCalled();
    });

    it('should set latitude and longitude when provided', async () => {
      assignmentRepository.findOne.mockResolvedValue(mockAssignment);
      assignmentRepository.save.mockResolvedValue({ ...mockAssignment, latitude: 25.76, longitude: -80.19 });

      const result = await service.startService('assignment-uuid', 'cleaner-uuid', 25.76, -80.19);

      expect(result.latitude).toBe(25.76);
      expect(result.longitude).toBe(-80.19);
    });

    it('should throw ForbiddenException for unassigned cleaner', async () => {
      assignmentRepository.findOne.mockResolvedValue(mockAssignment);

      await expect(
        service.startService('assignment-uuid', 'other-cleaner'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('completeService', () => {
    it('should complete service for assigned cleaner', async () => {
      const assignmentWithTimer = {
        ...mockAssignment,
        timerStart: new Date(Date.now() - 3600000) as any,
        hourlyRateSnapshot: 25,
      };
      assignmentRepository.findOne.mockResolvedValue(assignmentWithTimer);
      assignmentRepository.save.mockResolvedValue(assignmentWithTimer);
      userRepository.find.mockResolvedValue([{ id: 'admin-uuid' } as unknown as User]);

      const result = await service.completeService('assignment-uuid', 'cleaner-uuid');

      expect(result.status).toBe(AssignmentStatus.PENDING_VERIFICATION);
      expect(notificationsService.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for unassigned cleaner', async () => {
      assignmentRepository.findOne.mockResolvedValue(mockAssignment);

      await expect(
        service.completeService('assignment-uuid', 'other-cleaner'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('startTimer', () => {
    it('should start timer for assigned cleaner', async () => {
      assignmentRepository.findOne.mockResolvedValue(mockAssignment);
      assignmentRepository.save.mockResolvedValue(mockAssignment);

      const result = await service.startTimer('assignment-uuid', 'cleaner-uuid');

      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException for unassigned cleaner', async () => {
      assignmentRepository.findOne.mockResolvedValue(mockAssignment);

      await expect(
        service.startTimer('assignment-uuid', 'other-cleaner'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('stopTimer', () => {
    it('should stop timer and calculate minutes', async () => {
      const assignmentWithTimer = {
        ...mockAssignment,
        timerStart: new Date(Date.now() - 3600000),
        hourlyRateSnapshot: 25,
      };
      assignmentRepository.findOne.mockResolvedValue(assignmentWithTimer);
      assignmentRepository.save.mockResolvedValue(assignmentWithTimer);

      const result = await service.stopTimer('assignment-uuid', 'cleaner-uuid');

      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException for unassigned cleaner', async () => {
      assignmentRepository.findOne.mockResolvedValue(mockAssignment);

      await expect(
        service.stopTimer('assignment-uuid', 'other-cleaner'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getTodaysSummary', () => {
    it('should return summary counts', async () => {
      assignmentRepository.count.mockResolvedValue(5);

      const result = await service.getTodaysSummary();

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('completed');
      expect(result).toHaveProperty('inProgress');
      expect(result).toHaveProperty('pendingVerification');
      expect(result).toHaveProperty('pending');
    });
  });
});
