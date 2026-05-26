import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ServiceAssignment } from '../assignments/assignment.entity';
import { NotificationsService } from './notifications.service';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    @InjectRepository(ServiceAssignment)
    private readonly assignmentRepository: Repository<ServiceAssignment>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── RF-073: 24h reminder — runs every hour ──
  @Cron(CronExpression.EVERY_HOUR)
  async send24hReminders() {
    this.logger.log('Checking 24h reminders...');
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    await this.sendReminders(in24h, in25h, '24h');
  }

  // ── RF-073: 2h reminder — runs every 15 minutes ──
  @Cron(CronExpression.EVERY_30_MINUTES)
  async send2hReminders() {
    this.logger.log('Checking 2h reminders...');
    const now = new Date();
    const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const in2h30m = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);

    await this.sendReminders(in2h, in2h30m, '2h');
  }

  private async sendReminders(from: Date, to: Date, type: '24h' | '2h') {
    const assignments = await this.assignmentRepository.find({
      where: {
        scheduledDate: Between(from, to),
      },
      relations: ['service'],
    });

    for (const assignment of assignments) {
      if (!assignment.service) continue;

      if (type === '24h') {
        await this.notificationsService.notifyReminder24h(
          assignment.cleanerId,
          assignment.service.id,
          assignment.service.clientName,
          new Date(assignment.scheduledDate),
        );
      } else {
        await this.notificationsService.notifyReminder2h(
          assignment.cleanerId,
          assignment.service.id,
          assignment.service.clientName,
          new Date(assignment.scheduledDate),
        );
      }
    }

    if (assignments.length > 0) {
      this.logger.log(`Sent ${assignments.length} ${type} reminders`);
    }
  }
}
