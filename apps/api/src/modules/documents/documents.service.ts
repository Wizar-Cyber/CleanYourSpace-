import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './document.entity';
import { CreateDocumentDto } from '@corecon/types';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}

  async create(dto: CreateDocumentDto) {
    const doc = this.documentRepository.create({
      userId: dto.userId,
      category: dto.category as any,
      filename: dto.filename,
      originalName: dto.originalName,
      mimeType: dto.mimeType,
      size: dto.size,
      url: dto.url,
    } as any);

    return this.documentRepository.save(doc);
  }

  async findByUser(userId: string) {
    return this.documentRepository.find({
      where: { userId },
      order: { uploadedAt: 'DESC' },
    });
  }

  async findById(id: string) {
    const doc = await this.documentRepository.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async delete(id: string) {
    const doc = await this.findById(id);
    return this.documentRepository.remove(doc);
  }
}
