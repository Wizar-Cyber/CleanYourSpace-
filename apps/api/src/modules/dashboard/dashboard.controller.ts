import {
  Controller, Get, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async getActiveServices() {
    return this.dashboardService.getActiveServices();
  }

  @Get('today')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async getTodaySchedule() {
    return this.dashboardService.getTodaySchedule();
  }

  @Get('clocked-in')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async getClockedInCount() {
    return this.dashboardService.getClockedInCount();
  }

  @Get('incidents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async getOpenIncidents() {
    return this.dashboardService.getOpenIncidents();
  }

  @Get('hours')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async getTodayHours(@Query('date') date?: string) {
    return this.dashboardService.getTodayHours();
  }

  @Get('alerts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  async getAlerts() {
    return this.dashboardService.getAlerts();
  }

  @Get('missed')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async getMissedClockIns() {
    return this.dashboardService.getMissedClockIns();
  }

  @Get('geofence-alerts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async getGeofenceAlerts() {
    return this.dashboardService.getGeofenceAlerts();
  }
}