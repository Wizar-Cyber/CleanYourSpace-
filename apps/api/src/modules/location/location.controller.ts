import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LocationService } from './location.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateLocationLogDto } from '@corecon/types';
import { UserRole } from '../users/user.entity';

@Controller('location')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('log')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  logLocation(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateLocationLogDto,
  ) {
    return this.locationService.logLocation(userId, dto);
  }

  @Post('validate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  validateProximity(
    @CurrentUser('id') userId: string,
    @Body() body: {
      assignmentId: string;
      currentLat: number;
      currentLon: number;
      expectedLat: number;
      expectedLon: number;
    },
  ) {
    return this.locationService.validateProximity(
      userId,
      body.assignmentId,
      body.currentLat,
      body.currentLon,
      body.expectedLat,
      body.expectedLon,
    );
  }

  @Get('current')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  getCurrentLocation(@CurrentUser('id') userId: string) {
    return this.locationService.getCurrentLocation(userId);
  }

  @Get('history')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  getLocationHistory(
    @CurrentUser('id') userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.locationService.getLocationHistory(
      userId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('alerts/:assignmentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getAlerts(@Param('assignmentId') assignmentId: string) {
    return this.locationService.getAlerts(assignmentId);
  }

  @Put('alerts/:id/resolve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  resolveAlert(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.locationService.resolveAlert(id, userId);
  }
}
