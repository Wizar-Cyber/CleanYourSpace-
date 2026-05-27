import {
  Controller, Get, Post, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PhotosService } from './photos.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { CreatePhotoDto } from '@corecon/types';

@Controller('photos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Get('upload-url')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  async getUploadUrl(
    @Body('filename') filename: string,
    @Body('contentType') contentType: string,
  ) {
    return this.photosService.getSignedUploadUrl(filename, contentType);
  }

  @Get('assignment/:assignmentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  findByAssignment(@Param('assignmentId') assignmentId: string, @CurrentUser() user: any) {
    return this.photosService.findByAssignment(assignmentId, user);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  create(@Body() dto: CreatePhotoDto, @CurrentUser('id') userId: string) {
    return this.photosService.create(dto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR, UserRole.CONTRACTOR)
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.photosService.remove(id, user);
  }
}
