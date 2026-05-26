import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignmentsService } from '../modules/assignments/assignments.service';
import { ReportsService } from '../modules/reports/reports.service';
import { Report } from '../modules/reports/report.entity';

@Processor('reports')
@Injectable()
export class ReportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportProcessor.name);

  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    private readonly assignmentsService: AssignmentsService,
    private readonly reportsService: ReportsService,
  ) {
    super();
  }

  async process(job: Job<{ reportId: string }>) {
    this.logger.log(`Generating report: ${job.data.reportId}`);

    try {
      const report = await this.reportRepository.findOne({
        where: { id: job.data.reportId },
      });

      if (!report) {
        this.logger.warn(`Report not found: ${job.data.reportId}`);
        return;
      }

      const summary = await this.assignmentsService.getTodaysSummary();

      const reportData = {
        title: `${report.type} Report`,
        rows: [
          ['Total', String(summary.total)],
          ['Completed', String(summary.completed)],
          ['In Progress', String(summary.inProgress)],
          ['Pending Verification', String(summary.pendingVerification)],
        ],
      };

      let fileBuffer: Buffer;
      if (report.format === 'pdf') {
        fileBuffer = await this.reportsService.generatePDF(reportData);
        report.url = `/api/v1/reports/${report.id}/download`;
      }

      report.metadata = {
        ...(report.metadata || {}),
        summary,
        generatedAt: new Date().toISOString(),
        size: fileBuffer ? fileBuffer.length : 0,
      };

      await this.reportRepository.save(report);
      this.logger.log(`Report generated: ${job.data.reportId}`);
    } catch (error) {
      this.logger.error(`Report generation failed: ${job.data.reportId}`, error);
      throw error;
    }
  }
}
