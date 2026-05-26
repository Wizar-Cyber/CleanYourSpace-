import {
  Injectable, UnauthorizedException, ConflictException, NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/audit.entity';
import { MailService } from '../mail/mail.service';
import { CreateUserDto, ChangePasswordDto } from '@corecon/types';

@Injectable()
export class AuthService {
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: CreateUserDto, createdBy?: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone || null,
      role: dto.role,
      isActive: true,
      language: dto.language || 'en',
      hourlyRate: dto.hourlyRate || null,
      mustChangePassword: dto.role === UserRole.CONTRACTOR || dto.role === UserRole.SUPERVISOR,
      createdBy: createdBy || null,
    } as any);

    const saved = await this.userRepository.save(user) as unknown as User;

    await this.auditService.log({
      userId: saved.id,
      action: AuditAction.CREATE,
      entityType: 'user',
      entityId: saved.id,
      newValues: { email: saved.email, role: saved.role },
      ipAddress,
      userAgent,
    });

    return this.generateTokens(saved);
  }

  async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.LOGIN,
      entityType: 'user',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    return this.generateTokens(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, this.BCRYPT_ROUNDS);
    user.mustChangePassword = false;

    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET', 'change-me-refresh-secret'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub, isActive: true },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.refreshToken) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      const isTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isTokenValid) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000);
    const tokenHash = await bcrypt.hash(token, 10);

    await this.userRepository.update(user.id, {
      resetPasswordToken: tokenHash,
      resetPasswordExpires: expires,
    } as any);

    try {
      await this.mailService.sendPasswordResetEmail(user.email, token, user.firstName);
    } catch (error) {
      // Log but never reveal whether email exists
    }

    return { message: 'If the email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const users = await this.userRepository.find({
      where: { resetPasswordExpires: MoreThan(new Date()) },
    });

    let matchedUser: User | null = null;
    for (const user of users) {
      if (
        user.resetPasswordToken &&
        (await bcrypt.compare(token, user.resetPasswordToken))
      ) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    matchedUser.passwordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);
    matchedUser.resetPasswordToken = null as any;
    matchedUser.resetPasswordExpires = null as any;
    matchedUser.mustChangePassword = false;

    await this.userRepository.save(matchedUser);

    return { message: 'Password reset successfully' };
  }

  async logout(userId: string, ipAddress?: string, userAgent?: string) {
    await this.userRepository.update(userId, { refreshToken: null as any });

    await this.auditService.log({
      userId,
      action: AuditAction.LOGOUT,
      entityType: 'user',
      entityId: userId,
      ipAddress,
      userAgent,
    });
  }

  async validateUser(userId: string) {
    return this.userRepository.findOne({
      where: { id: userId, isActive: true },
      select: { passwordHash: false },
    });
  }

  private async generateTokens(user: User) {
    const jti = uuidv4();
    const payload = {
      jti,
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET', 'change-me-access-secret'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRY', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET', 'change-me-refresh-secret'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRY', '7d'),
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(user.id, { refreshToken: refreshTokenHash });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        phone: user.phone,
        photoUrl: user.photoUrl,
        language: user.language,
        hourlyRate: user.hourlyRate,
        mustChangePassword: user.mustChangePassword,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    };
  }
}
