import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TimeTrackingService } from './time-tracking.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClockInDto, ClockOutDto, ApproveTimeDto } from '@corecon/types';
import { UserRole } from '../users/user.entity';

@Controller('time-tracking')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TimeTrackingController {
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  @Post('clock-in')
  @Roles(UserRole.CONTRACTOR, UserRole.SUPERVISOR)
  async clockIn(@CurrentUser('id') userId: string, @Body() dto: ClockInDto) {
    return this.timeTrackingService.clockIn(dto, userId);
  }

  @Post('clock-out')
  @Roles(UserRole.CONTRACTOR, UserRole.SUPERVISOR)
  async clockOut(@CurrentUser('id') userId: string, @Body() dto: ClockOutDto) {
    return this.timeTrackingService.clockOut(dto, userId);
  }

  @Get('timer/:assignmentId')
  @Roles(UserRole.CONTRACTOR, UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getTimer(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.timeTrackingService.getTimer(assignmentId, userId);
  }

  @Get('history')
  @Roles(UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getHistory(@Query() query: any) {
    return this.timeTrackingService.getHistory(query);
  }

  @Get('report')
  @Roles(UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getReport(@Query() query: any) {
    return this.timeTrackingService.getReport(query);
  }

  @Put(':id/approve')
  @Roles(UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async approveTime(
    @Param('id') id: string,
    @Body() dto: ApproveTimeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.timeTrackingService.approveTime(id, dto, userId);
  }

  @Get(':id/inconsistencies')
  @Roles(UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async getInconsistencies(@Param('id') id: string) {
    return this.timeTrackingService.getInconsistencies(id);
  }

  @Post('periodic-log')
  @Roles(UserRole.CONTRACTOR, UserRole.SUPERVISOR)
  async logPeriodicLocation(
    @CurrentUser('id') userId: string,
    @Body() dto: { assignmentId: string; latitude: number; longitude: number; accuracy?: number },
  ) {
    return this.timeTrackingService.logPeriodicLocation(
      userId, dto.assignmentId, dto.latitude, dto.longitude, dto.accuracy,
    );
  }
}