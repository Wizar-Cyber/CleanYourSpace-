import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AssignmentsService } from './assignments.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateAssignmentDto, UpdateAssignmentDto } from '@corecon/types';
import { UserRole } from '../users/user.entity';
import { AssignmentStatus } from './assignment.entity';

@Controller('assignments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
    @Query('cleanerId') cleanerId?: string,
    @Query('date') date?: string,
  ) {
    return this.assignmentsService.findAll(page, limit, { status, cleanerId, date });
  }

  @Get('my')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  getMyAssignments(@CurrentUser('id') userId: string) {
    return this.assignmentsService.findByCleaner(userId);
  }

  @Get('today')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  getTodayAssignments(@CurrentUser('id') userId: string) {
    return this.assignmentsService.findTodayByCleaner(userId);
  }

  @Get('summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getSummary() {
    return this.assignmentsService.getTodaysSummary();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  findById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.assignmentsService.findById(id, user);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.update(id, dto);
  }

  @Put(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: AssignmentStatus,
    @CurrentUser('id') userId: string,
  ) {
    return this.assignmentsService.updateStatus(id, status, userId);
  }

  @Post(':id/start')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  startService(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('latitude') latitude?: number,
    @Body('longitude') longitude?: number,
  ) {
    return this.assignmentsService.startService(id, userId, latitude, longitude);
  }

  @Post(':id/complete')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  completeService(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.assignmentsService.completeService(id, userId);
  }

  @Post(':id/timer/start')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  startTimer(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.assignmentsService.startTimer(id, userId);
  }

  @Post(':id/timer/stop')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  stopTimer(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.assignmentsService.stopTimer(id, userId);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  create(@Body() dto: CreateAssignmentDto) {
    return this.assignmentsService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.update(id, dto);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: AssignmentStatus,
    @CurrentUser('id') userId: string,
  ) {
    return this.assignmentsService.updateStatus(id, status, userId);
  }

  @Post(':id/start')
  startService(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('latitude') latitude?: number,
    @Body('longitude') longitude?: number,
  ) {
    return this.assignmentsService.startService(id, userId, latitude, longitude);
  }

  @Post(':id/complete')
  completeService(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.assignmentsService.completeService(id, userId);
  }

  @Post(':id/timer/start')
  startTimer(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.assignmentsService.startTimer(id, userId);
  }

  @Post(':id/timer/stop')
  stopTimer(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.assignmentsService.stopTimer(id, userId);
  }
}
