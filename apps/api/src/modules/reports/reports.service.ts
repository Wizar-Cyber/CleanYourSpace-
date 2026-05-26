import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Report, ReportType, ReportFormat } from './report.entity';
import { ServiceAssignment, AssignmentStatus } from '../assignments/assignment.entity';
import { Service } from '../services/service.entity';
import { User } from '../users/user.entity';
import { TimeRecord } from '../time-tracking/time-record.entity';
import { Incident } from '../incidents/incident.entity';
import { GenerateReportDto } from '@corecon/types';
import PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(ServiceAssignment)
    private readonly assignmentRepository: Repository<ServiceAssignment>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TimeRecord)
    private readonly timeRecordRepository: Repository<TimeRecord>,
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
  ) {}

  async generate(dto: GenerateReportDto, userId: string) {
    const report = this.reportRepository.create({
      type: dto.type as ReportType,
      format: dto.format as ReportFormat,
      generatedBy: userId,
      filename: `report-${dto.type}-${dto.dateFrom}-${dto.dateTo}`,
      dateFrom: new Date(dto.dateFrom),
      dateTo: new Date(dto.dateTo),
    });
    return this.reportRepository.save(report);
  }

  async generateDaily(dto: GenerateReportDto & { contractorId?: string }) {
    const from = new Date(dto.dateFrom);
    const to = new Date(dto.dateTo);

    const whereDate = { scheduledDate: from.toISOString().split('T')[0] as any };
    const services = await this.assignmentRepository.find({
      where: whereDate,
      relations: ['service', 'cleaner'],
    });

    const completed = services.filter((a) => a.status === AssignmentStatus.COMPLETED as any).length;
    const inProgress = services.filter((a) => a.status === AssignmentStatus.IN_PROGRESS as any).length;
    const pending = services.filter((a) => a.status === AssignmentStatus.PENDING as any).length;

    const timeRecords = dto.contractorId
      ? await this.timeRecordRepository.find({
          where: { userId: dto.contractorId, type: 'clock_out' as any, timestamp: Between(from, to) },
        })
      : [];

    const totalMinutes = timeRecords.reduce((s, r) => {
      const a = services.find((svc) => svc.id === r.assignmentId);
      return s + (a?.totalMinutes || 0);
    }, 0);

    const incidents = await this.incidentRepository.count({
      where: { createdAt: Between(from, to) },
    });

    return {
      total: services.length,
      completed,
      inProgress,
      pending,
      hoursWorked: Math.round(totalMinutes / 60 * 100) / 100,
      incidents,
      qualityScore: services.length > 0 ? Math.round(completed / services.length * 100) : 0,
    };
  }

  async generateWeekly(from: Date, to: Date) {
    const services = await this.assignmentRepository.find({
      where: { scheduledDate: Between(from, to) as any },
      relations: ['service', 'cleaner'],
    });

    const completed = services.filter((a) => a.status === AssignmentStatus.COMPLETED as any).length;
    const cleaners = new Set(services.map((a) => a.cleanerId));
    const totalMinutes = services.reduce((s, a) => s + (a.totalMinutes || 0), 0);

    const incidents = await this.incidentRepository.count({ where: { createdAt: Between(new Date(from), new Date(to)) } });

    return {
      totalServices: services.length,
      completed,
      pending: services.length - completed,
      totalHours: Math.round(totalMinutes / 60 * 100) / 100,
      activeCleaners: cleaners.size,
      incidents,
      estimatedRevenue: Math.round(totalMinutes / 60 * (25) * 100) / 100,
    };
  }

  async generatePayroll(from: Date, to: Date, contractorId?: string) {
    const where: any = { role: 'contractor' as any };
    if (contractorId) where.id = contractorId;
    const contractors = await this.userRepository.find({ where });
    const contractTypes = contractors.map((c) => ({
      id: c.id, name: `${c.firstName} ${c.lastName}`,
      contractType: c.contractType || 'contractor_1099',
      hourlyRate: c.hourlyRate,
    }));
    return { contractors: contractTypes, period: { from, to } };
  }

  async generateClientReport(clientId: string, from: Date, to: Date) {
    return this.assignmentRepository.find({
      where: { service: { id: clientId } as any, scheduledDate: Between(from, to) as any },
      relations: ['service'],
    });
  }

  async generateIncidentReport(from: Date, to: Date) {
    return this.incidentRepository.find({
      where: { createdAt: Between(from, to) },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(page = 1, limit = 20) {
    const [data, total] = await this.reportRepository.findAndCount({
      skip: (page - 1) * limit, take: limit, order: { createdAt: 'DESC' },
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    return this.reportRepository.findOne({ where: { id } });
  }

  async generatePDF(data: { title: string; rows: string[][] }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.fontSize(18).text(data.title, { align: 'center' });
      doc.moveDown();
      data.rows.forEach((row) => doc.fontSize(10).text(row.join(' | '), { continued: false }));
      doc.end();
    });
  }

  async generateExcel(data: { title: string; columns: string[]; rows: unknown[][] }): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(data.title);
    sheet.columns = data.columns.map((col) => ({ header: col, key: col.toLowerCase().replace(/\s+/g, '_'), width: 20 }));
    data.rows.forEach((row) => sheet.addRow(row));
    return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }
}