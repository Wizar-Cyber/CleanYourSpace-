import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationType } from './notification.entity';
import { ServiceAssignment } from '../assignments/assignment.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { MailService } from '../mail/mail.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: any;
  let assignmentRepository: any;
  let realtimeGateway: any;
  let mailService: any;

  const mockNotification: any = {
    id: 'notif-uuid-1',
    userId: 'user-uuid-1',
    type: NotificationType.SYSTEM,
    title: 'Test Notification',
    body: 'This is a test',
    read: false,
    readAt: null,
    data: null,
    relatedServiceId: null,
    relatedAlertId: null,
    createdAt: new Date(),
  };

  const mockAssignment: any = {
    id: 'assign-uuid-1',
    serviceId: 'service-uuid-1',
    service: {
      id: 'service-uuid-1',
      clientName: 'John Doe',
      clientEmail: 'john@example.com',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: {
            findOne: jest.fn(),
            findAndCount: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ServiceAssignment),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: RealtimeGateway,
          useValue: {
            sendToUser: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendEmail: jest.fn().mockResolvedValue(undefined),
            sendNotificationEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationRepository = module.get(getRepositoryToken(Notification));
    assignmentRepository = module.get(getRepositoryToken(ServiceAssignment));
    realtimeGateway = module.get(RealtimeGateway);
    mailService = module.get(MailService);
  });

  describe('create', () => {
    it('should create a notification and send via realtime', async () => {
      notificationRepository.create.mockReturnValue(mockNotification);
      notificationRepository.save.mockResolvedValue(mockNotification);

      const result = await service.create({
        userId: 'user-uuid-1',
        type: NotificationType.SYSTEM,
        title: 'Test Notification',
        body: 'This is a test',
      });

      expect(result.title).toBe('Test Notification');
      expect(realtimeGateway.sendToUser).toHaveBeenCalledWith('user-uuid-1', 'notification', mockNotification);
    });
  });

  describe('findByUser', () => {
    it('should return paginated notifications for a user', async () => {
      notificationRepository.findAndCount.mockResolvedValue([[mockNotification], 1]);

      const result = await service.findByUser('user-uuid-1');

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      notificationRepository.count.mockResolvedValue(3);

      const result = await service.getUnreadCount('user-uuid-1');

      expect(result).toBe(3);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      notificationRepository.findOne.mockResolvedValue(mockNotification);
      notificationRepository.save.mockResolvedValue({ ...mockNotification, read: true, readAt: new Date() });

      const result = await service.markAsRead('notif-uuid-1', 'user-uuid-1');

      expect(result).not.toBeNull();
      expect(result!.read).toBe(true);
      expect(result!.readAt).toBeDefined();
    });

    it('should return null for non-existent notification', async () => {
      notificationRepository.findOne.mockResolvedValue(null);

      const result = await service.markAsRead('non-existent', 'user-uuid-1');

      expect(result).toBeNull();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      notificationRepository.update.mockResolvedValue({ affected: 3 });

      const result = await service.markAllAsRead('user-uuid-1');

      expect(result.message).toBe('All notifications marked as read');
      expect(notificationRepository.update).toHaveBeenCalledWith(
        { userId: 'user-uuid-1', read: false },
        { read: true, readAt: expect.any(Date) },
      );
    });
  });

  describe('notifyOnTheWay', () => {
    it('should send on-the-way notification and email', async () => {
      assignmentRepository.findOne.mockResolvedValue(mockAssignment);
      notificationRepository.create.mockReturnValue(mockNotification);
      notificationRepository.save.mockResolvedValue(mockNotification);

      await service.notifyOnTheWay('user-uuid-1', 'Maria', 'assign-uuid-1', 30);

      expect(mailService.sendEmail).toHaveBeenCalledWith(
        'john@example.com',
        expect.stringContaining('On The Way'),
        expect.any(String),
      );
      expect(realtimeGateway.sendToUser).toHaveBeenCalled();
    });

    it('should throw NotFoundException for missing assignment', async () => {
      assignmentRepository.findOne.mockResolvedValue(null);

      await expect(
        service.notifyOnTheWay('user-uuid-1', 'Maria', 'non-existent', 30),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('notifyStockAlert', () => {
    it('should create a stock alert notification', async () => {
      notificationRepository.create.mockReturnValue(mockNotification);
      notificationRepository.save.mockResolvedValue(mockNotification);

      await service.notifyStockAlert('user-uuid-1', 'All-Purpose Cleaner', 3, 5);

      expect(notificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-uuid-1',
          type: NotificationType.STOCK_ALERT,
          title: 'Low Stock Alert',
        }),
      );
    });
  });

  describe('notifyServiceAssigned', () => {
    it('should create notification and send email', async () => {
      notificationRepository.create.mockReturnValue(mockNotification);
      notificationRepository.save.mockResolvedValue(mockNotification);

      await service.notifyServiceAssigned('user-uuid-1', 'service-uuid-1', 'John Doe', new Date('2026-06-01'));

      expect(mailService.sendNotificationEmail).toHaveBeenCalled();
      expect(realtimeGateway.sendToUser).toHaveBeenCalled();
    });
  });

  describe('notifyServiceCancelled', () => {
    it('should create cancellation notification and send email', async () => {
      notificationRepository.create.mockReturnValue(mockNotification);
      notificationRepository.save.mockResolvedValue(mockNotification);

      await service.notifyServiceCancelled('user-uuid-1', 'service-uuid-1', 'John Doe');

      expect(mailService.sendNotificationEmail).toHaveBeenCalled();
    });
  });

  describe('notifyTimeApproved', () => {
    it('should create time approved notification', async () => {
      notificationRepository.create.mockReturnValue(mockNotification);
      notificationRepository.save.mockResolvedValue(mockNotification);

      await service.notifyTimeApproved('user-uuid-1', 120);

      expect(notificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Time Approved' }),
      );
      expect(mailService.sendNotificationEmail).toHaveBeenCalled();
    });
  });
});
