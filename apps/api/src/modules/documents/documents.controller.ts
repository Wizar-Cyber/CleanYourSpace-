import {
  Controller, Get, Post, Delete, Param, Body, UseGuards, UploadedFile, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { DocumentsService } from './documents.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { CreateDocumentDto } from '@corecon/types';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';

@Controller('documents')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  create(@Body() dto: CreateDocumentDto) {
    return this.documentsService.create(dto);
  }

  @Post('upload')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/documents',
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${uuidv4()}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF and image files are allowed'), false);
        }
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string,
    @Body('category') category: string,
  ) {
    if (!file) throw new BadRequestException('File is required');
    if (!userId) throw new BadRequestException('userId is required');

    const baseUrl = this.configService.get('BASE_URL', 'http://localhost:3000');
    const doc = await this.documentsService.create({
      userId,
      category: (category as any) || 'other',
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `${baseUrl}/uploads/documents/${file.filename}`,
    });

    return doc;
  }

  @Get('user/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER, UserRole.CONTRACTOR, UserRole.SUPERVISOR)
  findByUser(@Param('userId') userId: string) {
    return this.documentsService.findByUser(userId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MANAGER)
  delete(@Param('id') id: string) {
    return this.documentsService.delete(id);
  }
}
