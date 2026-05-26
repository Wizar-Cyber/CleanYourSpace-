import {
  Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { OwnershipGuard, Ownership } from '../../common/guards/ownership.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from '@corecon/types';
import { UserRole } from './user.entity';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard, OwnershipGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get('cleaners')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  findCleaners() {
    return this.usersService.findCleaners();
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getStats() {
    return this.usersService.getStats();
  }

  @Get('me')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR, UserRole.CLIENT)
  getProfile(@CurrentUser('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  create(@Body() dto: CreateUserDto, @CurrentUser('id') userId: string) {
    return this.usersService.create(dto, userId);
  }

  @Get('contractor/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  getContractorProfile(@Param('id') id: string) {
    return this.usersService.findContractorProfile(id);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR, UserRole.CLIENT)
  @Ownership('id')
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR, UserRole.CLIENT)
  @Ownership('id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') currentUserId: string,
    @CurrentUser('role') currentUserRole: string,
  ) {
    return this.usersService.update(id, dto, currentUserId, currentUserRole);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }
}
