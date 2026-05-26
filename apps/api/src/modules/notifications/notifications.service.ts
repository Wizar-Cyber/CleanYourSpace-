import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { ServiceAssignment } from '../assignments/assignment.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { MailService } from '../mail/mail.service';
import { CreateNotificationDto } from '@corecon/types';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(ServiceAssignment)
    private readonly assignmentRepository: Repository<ServiceAssignment>,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly mailService: MailService,
  ) {}

  async create(dto: CreateNotificationDto) {
    const notification = this.notificationRepository.create({
      userId: dto.userId,
      recipientId: dto.recipientId || null,
      type: dto.type as NotificationType,
      title: dto.title,
      body: dto.body,
      data: dto.data || null,
      relatedServiceId: dto.relatedServiceId || null,
      relatedAlertId: dto.relatedAlertId || null,
    } as any);

    const saved = await this.notificationRepository.save(notification) as unknown as Notification;

    this.realtimeGateway.sendToUser(saved.userId, 'notification', saved);

    return saved;
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1 },
    };
  }

  async getUnreadCount(userId: string) {
    return this.notificationRepository.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) return null;

    notification.read = true;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      { userId, read: false },
      { read: true, readAt: new Date() },
    );
    return { message: 'All notifications marked as read' };
  }

  // ── RF-070 / RF-071: High-level notification helpers ──

  async notifyServiceAssigned(userId: string, serviceId: string, clientName: string, scheduledDate: Date) {
    await this.create({
      userId,
      type: NotificationType.SERVICE_ASSIGNED as any,
      title: 'New Service Assigned',
      body: `You have been assigned to ${clientName} on ${scheduledDate.toLocaleDateString()}`,
      data: { serviceId, clientName, scheduledDate: scheduledDate.toISOString() },
      relatedServiceId: serviceId,
    });
    await this.mailService.sendNotificationEmail(
      userId,
      'New Service Assignment',
      `You have been assigned to a service at ${clientName} on ${scheduledDate.toLocaleDateString()}. Please check your dashboard for details.`,
    );
  }

  async notifyServiceCancelled(userId: string, serviceId: string, clientName: string) {
    await this.create({
      userId,
      type: NotificationType.SERVICE_CANCELLED as any,
      title: 'Service Cancelled',
      body: `The service for ${clientName} has been cancelled`,
      data: { serviceId, clientName },
      relatedServiceId: serviceId,
    });
    await this.mailService.sendNotificationEmail(
      userId,
      'Service Cancelled',
      `The service scheduled for ${clientName} has been cancelled. Please check your dashboard for updates.`,
    );
  }

  async notifyChecklistReturned(userId: string, serviceId: string, reason?: string) {
    await this.create({
      userId,
      type: NotificationType.CHECKLIST_RETURNED as any,
      title: 'Checklist Returned',
      body: reason ? `Checklist was returned: ${reason}` : 'Your checklist has been returned for revision',
      data: { serviceId, reason },
      relatedServiceId: serviceId,
    });
  }

  async notifyIncidentReported(userId: string, assignmentId: string, title: string, severity: string) {
    await this.create({
      userId,
      type: NotificationType.INCIDENT_REPORTED as any,
      title: 'Incident Reported',
      body: `[${severity.toUpperCase()}] ${title}`,
      data: { assignmentId, severity },
    });
  }

  async notifyTimeApproved(userId: string, minutes: number) {
    await this.create({
      userId,
      type: NotificationType.TIME_APPROVED as any,
      title: 'Time Approved',
      body: `${minutes} minutes have been approved`,
      data: { minutes },
    });
    await this.mailService.sendNotificationEmail(
      userId,
      'Time Approved',
      `Your recorded time of ${minutes} minutes has been approved.`,
    );
  }

  async notifyTimeRejected(userId: string, reason?: string) {
    await this.create({
      userId,
      type: NotificationType.TIME_REJECTED as any,
      title: 'Time Rejected',
      body: reason ? `Time record rejected: ${reason}` : 'A time record has been rejected',
      data: { reason },
    });
    await this.mailService.sendNotificationEmail(
      userId,
      'Time Record Rejected',
      reason
        ? `A time record was rejected: ${reason}. Please review and resubmit.`
        : 'A time record has been rejected. Please review and resubmit.',
    );
  }

  async notifyOnTheWay(contractorId: string, contractorName: string, assignmentId: string, etaMinutes?: number) {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ['service'],
    });
    if (!assignment?.service) {
      throw new NotFoundException('Assignment not found');
    }

    const clientEmail = assignment.service.clientEmail;
    const clientName = assignment.service.clientName;

    if (clientEmail) {
      const body = etaMinutes
        ? `${contractorName} is on the way and will arrive in approximately ${etaMinutes} minutes.`
        : `${contractorName} is on the way to your location.`;
      await this.mailService.sendEmail(
        clientEmail,
        `${contractorName} is On The Way!`,
        `<div style="font-family:sans-serif;padding:24px;max-width:600px;margin:0 auto;">
          <div style="background:#B8860B;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0;">
            <h2 style="margin:0;font-size:18px;">Corecon</h2>
          </div>
          <div style="background:#f9fafb;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
            <p>Hello <strong>${clientName}</strong>,</p>
            <p>${body}</p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
            <p style="color:#9ca3af;font-size:12px;">This is an automated message from Corecon. Please do not reply.</p>
          </div>
        </div>`,
      );
    }

    await this.create({
      userId: contractorId,
      type: NotificationType.ON_THE_WAY as any,
      title: 'On The Way',
      body: etaMinutes
        ? `You notified ${clientName} — ETA ${etaMinutes} minutes`
        : `You notified ${clientName} that you are on the way`,
      data: { assignmentId, etaMinutes, clientName },
      relatedServiceId: assignment.serviceId,
    });
  }

  async notifyReminder24h(userId: string, serviceId: string, clientName: string, scheduledDate: Date) {
    await this.create({
      userId,
      type: NotificationType.REMINDER_24H as any,
      title: 'Service Tomorrow',
      body: `Reminder: you have a service at ${clientName} tomorrow at ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      data: { serviceId, clientName, scheduledDate: scheduledDate.toISOString() },
      relatedServiceId: serviceId,
    });
  }

  async notifyReminder2h(userId: string, serviceId: string, clientName: string, scheduledDate: Date) {
    await this.create({
      userId,
      type: NotificationType.REMINDER_2H as any,
      title: 'Service Soon',
      body: `Reminder: you have a service at ${clientName} in 2 hours at ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      data: { serviceId, clientName, scheduledDate: scheduledDate.toISOString() },
      relatedServiceId: serviceId,
    });
  }

  async notifyStockAlert(managerUserId: string, supplyName: string, currentStock: number, stockMin: number) {
    await this.create({
      userId: managerUserId,
      type: NotificationType.STOCK_ALERT as any,
      title: 'Low Stock Alert',
      body: `"${supplyName}" is low (${currentStock}/${stockMin}). Please restock.`,
      data: { supplyName, currentStock, stockMin },
    });
  }
}
