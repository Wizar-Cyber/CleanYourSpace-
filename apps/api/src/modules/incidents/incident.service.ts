import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident, IncidentStatus } from './incident.entity';
import { AuditService } from '../audit/audit.service';
import { CreateIncidentDto, UpdateIncidentDto } from '@corecon/types';

@Injectable()
export class IncidentService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateIncidentDto, userId: string) {
    const incident = this.incidentRepository.create({
      assignmentId: dto.assignmentId,
      title: dto.title,
      description: dto.description,
      severity: dto.severity || 'low',
      photoUrls: dto.photoUrls || [],
      reportedBy: userId,
    } as Incident);
    return this.incidentRepository.save(incident);
  }

  async findByAssignment(assignmentId: string) {
    return this.incidentRepository.find({
      where: { assignmentId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string) {
    const incident = await this.incidentRepository.findOne({
      where: { id }, relations: ['assignment'],
    });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  async updateStatus(id: string, dto: UpdateIncidentDto, userId: string) {
    const incident = await this.incidentRepository.findOne({ where: { id } });
    if (!incident) throw new NotFoundException('Incident not found');

    incident.status = dto.status as IncidentStatus;
    incident.resolvedBy = userId;

    if (dto.status === IncidentStatus.RESOLVED || dto.status === IncidentStatus.CLOSED) {
      incident.resolvedAt = new Date();
      incident.resolutionNotes = dto.resolutionNotes || null;
    }

    return this.incidentRepository.save(incident);
  }

  async findAll(page = 1, limit = 20) {
    const [data, total] = await this.incidentRepository.findAndCount({
      skip: (page - 1) * limit, take: limit,
      order: { createdAt: 'DESC' },
      relations: ['assignment'],
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}