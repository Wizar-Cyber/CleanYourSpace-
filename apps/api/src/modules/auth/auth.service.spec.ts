import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User, UserRole } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let jwtService: any;

  const mockUser: any = {
    id: 'uuid-123',
    email: 'test@corecon.us',
    passwordHash: 'hashed_password',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.CLEANER,
    isActive: true,
    phone: null,
    photoUrl: null,
    language: 'en',
    hourlyRate: 25,
    mustChangePassword: true,
    createdBy: null,
    refreshToken: 'some-refresh-token-hash',
    createdAt: new Date(),
    updatedAt: new Date(),
    assignments: [],
    locationLogs: [],
    locationAlerts: [],
    photos: [],
    notifications: [],
  };

  beforeEach(async () => {
    (bcrypt.hash as jest.Mock).mockReset();
    (bcrypt.compare as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockResolvedValue('mocked_hash');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true as never);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_key: string, defaultValue?: string) => defaultValue),
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

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@corecon.us',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.CLEANER,
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe('test@corecon.us');
    });

    it('should throw ConflictException for duplicate email', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@corecon.us',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.CLEANER,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true as never);

      const result = await service.login('test@corecon.us', 'Password123!');

      expect(result).toHaveProperty('tokens');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login('wrong@email.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false as never);

      await expect(
        service.login('test@corecon.us', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    it('should change password and clear mustChangePassword flag', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true as never);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed' as never);

      const result = await service.changePassword('uuid-123', {
        currentPassword: 'oldPassword',
        newPassword: 'NewPassword123!',
      });

      expect(result.message).toBe('Password changed successfully');
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ mustChangePassword: false }),
      );
    });

    it('should throw NotFoundException for non-existent user', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.changePassword('non-existent', {
          currentPassword: 'old',
          newPassword: 'new',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException for incorrect current password', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false as never);

      await expect(
        service.changePassword('uuid-123', {
          currentPassword: 'wrong',
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      jwtService.verify.mockReturnValue({ sub: 'uuid-123' });
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true as never);

      const result = await service.refresh('valid-refresh-token');

      expect(result).toHaveProperty('tokens');
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
