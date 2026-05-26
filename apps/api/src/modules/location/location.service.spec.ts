import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LocationService } from './location.service';
import { LocationLog } from './location-log.entity';
import { LocationAlert } from './location-alert.entity';

describe('LocationService', () => {
  let service: LocationService;

  beforeEach(async () => {
    const mockCreateAlert = jest.fn().mockReturnValue({
      id: 'alert-1',
      userId: '',
      assignmentId: '',
      type: 'radius_exceeded',
      latitude: 0,
      longitude: 0,
      expectedLatitude: 0,
      expectedLongitude: 0,
      distance: 0,
      graceEndsAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: getRepositoryToken(LocationLog),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(LocationAlert),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn().mockResolvedValue(null),
            create: mockCreateAlert,
            save: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
  });

  describe('Haversine Distance', () => {
    it('should return 0 distance for same point', async () => {
      jest.spyOn(service as any, 'logLocation').mockResolvedValue({} as any);

      const result = await service.validateProximity(
        'user-1', 'assignment-1',
        25.7617, -80.1918,
        25.7617, -80.1918,
      );

      expect(result.distance).toBeLessThan(1);
      expect(result.valid).toBe(true);
    });

    it('should detect when outside radius', async () => {
      jest.spyOn(service as any, 'logLocation').mockResolvedValue({} as any);

      const result = await service.validateProximity(
        'user-1', 'assignment-1',
        25.7617, -80.1918,
        25.7800, -80.2100,
      );

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('distance');
      expect(result).toHaveProperty('alert');
    });
  });
});
