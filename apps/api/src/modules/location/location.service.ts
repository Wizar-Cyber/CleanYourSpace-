import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationLog } from './location-log.entity';
import { LocationAlert, AlertType } from './location-alert.entity';
import { CreateLocationLogDto } from '@corecon/types';

const VALIDATION_RADIUS = 100;
const GRACE_PERIOD_MS = 10 * 60 * 1000;

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(LocationLog)
    private readonly logRepository: Repository<LocationLog>,
    @InjectRepository(LocationAlert)
    private readonly alertRepository: Repository<LocationAlert>,
  ) {}

  async logLocation(userId: string, dto: CreateLocationLogDto) {
    const log = this.logRepository.create({
      userId,
      assignmentId: dto.assignmentId || null,
      latitude: dto.latitude,
      longitude: dto.longitude,
      accuracy: dto.accuracy || null,
      timestamp: new Date(dto.timestamp),
      isWithinRadius: dto.isWithinRadius ?? null,
    } as any);

    return this.logRepository.save(log);
  }

  async validateProximity(
    userId: string,
    assignmentId: string,
    currentLat: number,
    currentLon: number,
    expectedLat: number,
    expectedLon: number,
  ) {
    const distance = haversineDistance(currentLat, currentLon, expectedLat, expectedLon);

    // Check if there's an active unresolved alert for this assignment
    const activeAlert = await this.alertRepository.findOne({
      where: { assignmentId, userId, resolved: false },
      order: { createdAt: 'DESC' },
    });

    if (distance > VALIDATION_RADIUS) {
      // If outside radius and no active alert, create one with grace period
      if (!activeAlert) {
        const alert = this.alertRepository.create({
          userId,
          assignmentId,
          type: AlertType.RADIUS_EXCEEDED,
          latitude: currentLat,
          longitude: currentLon,
          expectedLatitude: expectedLat,
          expectedLongitude: expectedLon,
          distance,
          graceEndsAt: new Date(Date.now() + GRACE_PERIOD_MS),
        });

        await this.alertRepository.save(alert);

        return {
          valid: false,
          distance,
          radius: VALIDATION_RADIUS,
          alert: true,
          graceEndsAt: alert.graceEndsAt,
        };
      }

      // Check if grace period has expired
      if (activeAlert.graceEndsAt && new Date() > activeAlert.graceEndsAt) {
        // Send alert notification only once
        if (!activeAlert.alertSentAt) {
          activeAlert.alertSentAt = new Date();
          await this.alertRepository.save(activeAlert);
        }

        return {
          valid: false,
          distance,
          radius: VALIDATION_RADIUS,
          alert: true,
          graceExpired: true,
        };
      }

      // Still within grace period
      return {
        valid: true,
        distance,
        radius: VALIDATION_RADIUS,
        alert: false,
        graceActive: true,
        graceEndsAt: activeAlert.graceEndsAt,
      };
    }

    // Back within radius - resolve any active alert
    if (activeAlert) {
      activeAlert.resolved = true;
      activeAlert.resolvedAt = new Date();
      await this.alertRepository.save(activeAlert);

      const restoredAlert = this.alertRepository.create({
        userId,
        assignmentId,
        type: AlertType.RADIUS_RESTORED,
        latitude: currentLat,
        longitude: currentLon,
        expectedLatitude: expectedLat,
        expectedLongitude: expectedLon,
        distance,
        resolved: true,
        resolvedAt: new Date(),
      });

      await this.alertRepository.save(restoredAlert);
    }

    return {
      valid: true,
      distance,
      radius: VALIDATION_RADIUS,
      alert: false,
    };
  }

  async getCurrentLocation(userId: string) {
    return this.logRepository.findOne({
      where: { userId },
      order: { timestamp: 'DESC' },
    });
  }

  async getLocationHistory(userId: string, from?: Date, to?: Date) {
    const query = this.logRepository.createQueryBuilder('l')
      .where('l.userId = :userId', { userId })
      .orderBy('l.timestamp', 'DESC')
      .take(100);

    if (from) query.andWhere('l.timestamp >= :from', { from });
    if (to) query.andWhere('l.timestamp <= :to', { to });

    return query.getMany();
  }

  async getAlerts(assignmentId: string) {
    return this.alertRepository.find({
      where: { assignmentId },
      order: { createdAt: 'DESC' },
    });
  }

  async resolveAlert(alertId: string, reviewedBy?: string) {
    const alert = await this.alertRepository.findOne({ where: { id: alertId } });

    if (!alert) return null;

    alert.resolved = true;
    alert.resolvedAt = new Date();
    if (reviewedBy) {
      alert.reviewedBy = reviewedBy;
      alert.reviewedAt = new Date();
    }
    return this.alertRepository.save(alert);
  }

  async getActiveAlertsForAssignment(assignmentId: string) {
    return this.alertRepository.find({
      where: { assignmentId, resolved: false },
      order: { createdAt: 'DESC' },
    });
  }
}
