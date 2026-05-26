import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Photo, PhotoStatus } from './photo.entity';
import { ServiceAssignment } from '../assignments/assignment.entity';
import { CreatePhotoDto } from '@corecon/types';
import * as Minio from 'minio';
import { randomUUID } from 'crypto';

@Injectable()
export class PhotosService {
  private minioClient: Minio.Client;
  private bucket: string;

  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    @InjectRepository(ServiceAssignment)
    private readonly assignmentRepository: Repository<ServiceAssignment>,
    private readonly configService: ConfigService,
  ) {
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.configService.get('MINIO_PORT', '9000'), 10),
      useSSL: this.configService.get('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get('MINIO_ACCESS_KEY', 'corecon'),
      secretKey: this.configService.get('MINIO_SECRET_KEY', 'changeme'),
    });
    this.bucket = this.configService.get('MINIO_BUCKET', 'corecon-photos');
  }

  async getSignedUploadUrl(filename: string, _contentType: string) {
    const key = `uploads/${randomUUID()}-${filename}`;
    const url = await this.minioClient.presignedPutObject(this.bucket, key, 60 * 60);
    return { url, key };
  }

  async getSignedDownloadUrl(key: string) {
    const url = await this.minioClient.presignedGetObject(this.bucket, key, 60 * 60);
    return { url };
  }

  async create(dto: CreatePhotoDto, userId: string) {
    if (dto.size > 512000) {
      throw new BadRequestException('Photo size exceeds 500KB maximum');
    }
    const photo = this.photoRepository.create({
      ...dto,
      uploadedBy: userId,
      status: PhotoStatus.PENDING,
    } as any);
    return this.photoRepository.save(photo);
  }

  async findByAssignment(assignmentId: string, requestingUser?: { id: string; role: string }) {
    if (requestingUser && requestingUser.role !== 'admin') {
      const assignment = await this.assignmentRepository.findOne({
        where: { id: assignmentId, cleanerId: requestingUser.id },
      });
      if (!assignment) {
        throw new ForbiddenException('You do not have access to photos for this assignment');
      }
    }

    return this.photoRepository.find({
      where: { assignmentId },
      order: { createdAt: 'DESC' },
    });
  }

  async markUploaded(id: string, url: string, compressedSize?: number) {
    const photo = await this.photoRepository.findOne({ where: { id } });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    if (compressedSize && compressedSize > 500) {
      throw new BadRequestException('Compressed photo exceeds 500KB maximum');
    }

    photo.status = PhotoStatus.COMPLETED;
    photo.url = url;
    if (compressedSize) photo.compressedSize = compressedSize;

    return this.photoRepository.save(photo);
  }

  async remove(id: string, requestingUser?: { id: string; role: string }) {
    const photo = await this.photoRepository.findOne({ where: { id } });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    if (requestingUser && requestingUser.role !== 'admin' && photo.uploadedBy !== requestingUser.id) {
      throw new ForbiddenException('You do not have access to this photo');
    }

    return this.photoRepository.remove(photo);
  }
}
