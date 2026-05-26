import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateNotificationDto, RegisterPushSubscriptionDto } from '@corecon/types';
import { UserRole } from '../users/user.entity';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushService: PushService,
  ) {}

  // ── RF-075: Notification Center ──

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR, UserRole.CLIENT)
  findByUser(
    @CurrentUser('id') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.notificationsService.findByUser(userId, page, limit);
  }

  @Get('unread-count')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR, UserRole.CLIENT)
  getUnreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Put(':id/read')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR, UserRole.CLIENT)
  markAsRead(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Put('read-all')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR, UserRole.CLIENT)
  markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  // ── RF-072: Push Subscription (Fase 2) ──

  @Post('push/register')
  @Roles(UserRole.CONTRACTOR, UserRole.SUPERVISOR, UserRole.MANAGER)
  async registerPush(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterPushSubscriptionDto,
  ) {
    return this.pushService.register(userId, dto.endpoint, dto.p256dh, dto.auth, dto.userAgent);
  }

  @Post('push/unregister')
  @Roles(UserRole.CONTRACTOR, UserRole.SUPERVISOR, UserRole.MANAGER)
  async unregisterPush(
    @CurrentUser('id') userId: string,
    @Body() body: { endpoint: string },
  ) {
    return this.pushService.unregister(userId, body.endpoint);
  }

  // ── RF-074: On The Way notification (Fase 2) ──

  @Post('on-the-way')
  @Roles(UserRole.CONTRACTOR)
  async onTheWay(
    @CurrentUser('id') userId: string,
    @CurrentUser('firstName') firstName: string,
    @Body() body: { assignmentId: string; etaMinutes?: number },
  ) {
    return this.notificationsService.notifyOnTheWay(
      userId,
      firstName || 'Your cleaner',
      body.assignmentId,
      body.etaMinutes,
    );
  }

  // ── VAPID public key for push subscriptions ──

  @Get('vapid-public-key')
  @Roles(UserRole.CONTRACTOR, UserRole.SUPERVISOR, UserRole.MANAGER)
  getVapidPublicKey() {
    return { publicKey: this.pushService.getVapidPublicKey() };
  }
}
