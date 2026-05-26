import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IncidentService } from './incident.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { CreateIncidentDto, UpdateIncidentDto } from '@corecon/types';

@Controller('incidents')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  @Post()
  @Roles(UserRole.CONTRACTOR, UserRole.SUPERVISOR, UserRole.MANAGER)
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateIncidentDto) {
    return this.incidentService.create(dto, userId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  async findById(@Param('id') id: string) {
    return this.incidentService.findById(id);
  }

  @Get('assignment/:assignmentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  async findByAssignment(@Param('assignmentId') assignmentId: string) {
    return this.incidentService.findByAssignment(assignmentId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.incidentService.findAll(Number(page), Number(limit));
  }

  @Put(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  async updateStatus(
    @Param('id') id: string, @Body() dto: UpdateIncidentDto, @CurrentUser('id') userId: string,
  ) {
    return this.incidentService.updateStatus(id, dto, userId);
  }
}