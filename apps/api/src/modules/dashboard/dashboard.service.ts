import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceAssignment, AssignmentStatus } from '../assignments/assignment.entity';
import { TimeRecord, TimeRecordType } from '../time-tracking/time-record.entity';
import { Incident, IncidentStatus } from '../incidents/incident.entity';
import { LocationAlert } from '../location/location-alert.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(ServiceAssignment)
    private readonly assignmentRepository: Repository<ServiceAssignment>,
    @InjectRepository(TimeRecord)
    private readonly timeRecordRepository: Repository<TimeRecord>,
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    @InjectRepository(LocationAlert)
    private readonly locationAlertRepository: Repository<LocationAlert>,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async getActiveServices() {
    const today = new Date().toISOString().split('T')[0];
    const data = await this.assignmentRepository.find({
      where: {
        status: AssignmentStatus.IN_PROGRESS as any,
        scheduledDate: today as any,
      },
      relations: ['service', 'cleaner'],
      order: { scheduledStartTime: 'ASC' },
    });
    this.realtimeGateway.sendToAdmin('dashboard-active', data);
    return data;
  }

  async getTodaySchedule() {
    const today = new Date().toISOString().split('T')[0];
    const data = await this.assignmentRepository.find({
      where: { scheduledDate: today as any },
      relations: ['service', 'cleaner'],
      order: { scheduledStartTime: 'ASC' },
    });
    this.realtimeGateway.sendToAdmin('dashboard-today', data);
    return data;
  }

  async getClockedInCount() {
    const data = await this.timeRecordRepository.count({
      where: { type: TimeRecordType.CLOCK_IN as any, timestamp: new Date() },
    });
    this.realtimeGateway.sendToAdmin('dashboard-clocked-in', { count: data });
    return data;
  }

  async getOpenIncidents() {
    const [total, open] = await Promise.all([
      this.incidentRepository.count(),
      this.incidentRepository.count({
        where: { status: IncidentStatus.OPEN as any },
      }),
    ]);
    const inReview = await this.incidentRepository.count({
      where: { status: IncidentStatus.IN_REVIEW as any },
    });
    const resolved = await this.incidentRepository.count({ where: { status: IncidentStatus.RESOLVED as any } });
    const data = { total, open, inReview, resolved };
    this.realtimeGateway.sendToAdmin('dashboard-incidents', data);
    return data;
  }

  async getTodayHours() {
    const today = new Date().toISOString().split('T')[0];
    const records = await this.timeRecordRepository.find({
      where: { type: TimeRecordType.CLOCK_OUT as any, timestamp: new Date() },
    });
    this.realtimeGateway.sendToAdmin('dashboard-hours', records);
    return records;
  }

  async getAlerts() {
    const data = await this.locationAlertRepository.find({
      where: { resolved: false },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    this.realtimeGateway.sendToAdmin('dashboard-alerts', data);
    return data;
  }

  async getGeofenceAlerts() {
    const data = await this.locationAlertRepository.count({ where: { resolved: false } });
    this.realtimeGateway.sendToAdmin('dashboard-geofence-alerts', { count: data });
    return data;
  }

  async getMissedClockIns() {
    const today = new Date().toISOString().split('T')[0];
    const scheduled = await this.assignmentRepository.find({
      where: { scheduledDate: today as any, status: AssignmentStatus.PENDING as any },
      relations: ['service'],
    });
    const data = scheduled.map(a => ({
      id: a.id, clientName: (a.service as any)?.clientName || '', address: (a.service as any)?.address || '',
    }));
    this.realtimeGateway.sendToAdmin('dashboard-missed', data);
    return data;
  }
}