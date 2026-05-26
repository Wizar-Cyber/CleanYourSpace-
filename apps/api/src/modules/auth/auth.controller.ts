import {
  Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req, UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SkipPasswordCheck } from '../../common/decorators/skip-password-check.decorator';
import { RedisService } from '../../common/redis/redis.service';
import { CreateUserDto, LoginDto, ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from '@corecon/types';
import { UserRole } from '../users/user.entity';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('register')
  async register(@Body() dto: CreateUserDto, @Req() req: Request) {
    const ip = req.ip || req.headers['x-forwarded-for'] as string || '';
    const ua = req.headers['user-agent'] || '';
    return this.authService.register(dto, undefined, ip, ua);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.headers['x-forwarded-for'] as string || '';
    const ua = req.headers['user-agent'] || '';
    return this.authService.login(dto.email, dto.password, ip, ua);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Post('change-password')
  @SkipPasswordCheck()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.CONTRACTOR, UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.CONTRACTOR, UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.SUPER_ADMIN, UserRole.CLIENT)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser('id') userId: string, @Req() req: Request) {
    const authHeader = req.headers.authorization;
    const ip = req.ip || req.headers['x-forwarded-for'] as string || '';
    const ua = req.headers['user-agent'] || '';
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const payload: any = this.jwtService.decode(token);
        if (payload?.jti && payload?.exp) {
          const ttl = Math.max(1, Math.floor(payload.exp - Date.now() / 1000));
          await this.redisService.blacklistToken(payload.jti, ttl);
        }
      } catch {
        // Ignore decode errors
      }
    }
    await this.authService.logout(userId, ip, ua);
    return { message: 'Logged out successfully' };
  }
}
