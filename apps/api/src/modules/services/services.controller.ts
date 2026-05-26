import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServicesService } from './services.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateServiceDto, UpdateServiceDto, CancelServiceDto,
  ServiceHistoryQueryDto, CalendarQueryDto, CreateServiceTypeDto,
} from '@corecon/types';
import { UserRole } from '../users/user.entity';
import { ServiceStatus } from './service.entity';

@Controller('services')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.servicesService.findAll(page, limit);
  }

  @Get('types')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getServiceTypes() {
    return this.servicesService.getServiceTypes();
  }

  @Get('calendar')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  getCalendar(@Query() query: CalendarQueryDto) {
    return this.servicesService.getCalendar(query);
  }

  @Get('history')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getHistory(@Query() query: ServiceHistoryQueryDto) {
    return this.servicesService.getHistory(query);
  }

  @Get('status/:status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  findByStatus(@Param('status') status: ServiceStatus) {
    return this.servicesService.findByStatus(status);
  }

  @Get('summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  getSummary() {
    return this.servicesService.getTodaySummary();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  findById(@Param('id') id: string) {
    return this.servicesService.findById(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  create(
    @Body() dto: CreateServiceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.servicesService.create(dto, userId);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
    @CurrentUser('role') userRole: string,
  ) {
    return this.servicesService.update(id, dto, userRole);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }

  @Post(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CONTRACTOR)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: ServiceStatus,
    @Body('reason') reason: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.servicesService.updateStatus(id, status, userId, reason);
  }

  @Post(':id/cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelServiceDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.servicesService.cancelService(id, dto, userId);
  }

  @Put(':id/reschedule')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  reschedule(
    @Param('id') id: string,
    @Body('scheduledAt') scheduledAt: string,
  ) {
    return this.servicesService.reschedule(id, new Date(scheduledAt));
  }

  @Post('types')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  createServiceType(@Body() dto: CreateServiceTypeDto) {
    return this.servicesService.createServiceType(dto);
  }

  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  approve(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.servicesService.updateStatus(id, ServiceStatus.COMPLETED, userId);
  }

  @Post(':id/request-verification')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  requestVerification(@Param('id') id: string) {
    return this.servicesService.updateStatus(id, ServiceStatus.NEEDS_REVIEW);
  }
}
