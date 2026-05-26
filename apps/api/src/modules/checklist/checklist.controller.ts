import {
  Controller, Get, Post, Put, Body, Param, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChecklistService } from './checklist.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateChecklistTemplateDto, UpdateChecklistItemDto } from '@corecon/types';
import { UserRole } from '../users/user.entity';

@Controller('checklist')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  @Get('templates')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  getTemplates() {
    return this.checklistService.getTemplates();
  }

  @Post('templates')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  createTemplate(@Body() dto: CreateChecklistTemplateDto) {
    return this.checklistService.createTemplate(dto);
  }

  @Get('assignment/:assignmentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  getAssignmentChecklist(@Param('assignmentId') assignmentId: string, @CurrentUser() user: any) {
    return this.checklistService.getAssignmentChecklist(assignmentId, user);
  }

  @Post('assignment/:assignmentId/init/:templateId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  initChecklist(
    @Param('assignmentId') assignmentId: string,
    @Param('templateId') templateId: string,
  ) {
    return this.checklistService.initChecklistForAssignment(assignmentId, templateId);
  }

  @Put('item/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateChecklistItemDto,
    @CurrentUser('id') userId: string,
    @CurrentUser() user: any,
  ) {
    return this.checklistService.updateItem(id, dto, userId, user);
  }
}
