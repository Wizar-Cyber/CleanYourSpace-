import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PushSubscription } from './push-subscription.entity';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    @InjectRepository(PushSubscription)
    private readonly subscriptionRepository: Repository<PushSubscription>,
    private readonly configService: ConfigService,
  ) {}

  async register(userId: string, endpoint: string, p256dh: string, auth: string, userAgent?: string) {
    const existing = await this.subscriptionRepository.findOne({
      where: { userId, endpoint },
    });

    if (existing) {
      existing.p256dh = p256dh;
      existing.auth = auth;
      if (userAgent) existing.userAgent = userAgent;
      return this.subscriptionRepository.save(existing);
    }

    return this.subscriptionRepository.save(
      this.subscriptionRepository.create({
        userId,
        endpoint,
        p256dh,
        auth,
        userAgent: userAgent || null,
      } as PushSubscription),
    );
  }

  async unregister(userId: string, endpoint: string) {
    await this.subscriptionRepository.delete({ userId, endpoint });
    return { message: 'Subscription removed' };
  }

  async getUserSubscriptions(userId: string) {
    return this.subscriptionRepository.find({ where: { userId } });
  }

  async sendPushNotification(userId: string, title: string, body: string, icon?: string, data?: Record<string, unknown>) {
    const subscriptions = await this.getUserSubscriptions(userId);

    if (subscriptions.length === 0) {
      this.logger.warn(`No push subscriptions for user ${userId}`);
      return;
    }

    const vapidPublicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      this.logger.warn('VAPID keys not configured — push notifications disabled');
      return;
    }

    let webpush: any;
    try {
      webpush = require('web-push');
      webpush.setVapidDetails(
        'mailto:support@corecon.us',
        vapidPublicKey,
        vapidPrivateKey,
      );
    } catch {
      this.logger.warn('web-push package not installed — push notifications disabled');
      return;
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icons/icon-192.png',
      data: data || {},
      timestamp: new Date().toISOString(),
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        }, payload),
      ),
    );

    const expiredEndpoints: string[] = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'rejected') {
        const err = result.reason;
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          expiredEndpoints.push(subscriptions[i].endpoint);
        }
        this.logger.error(`Push send failed: ${err?.message}`);
      }
    }

    if (expiredEndpoints.length > 0) {
      await this.subscriptionRepository.delete({
        userId,
        endpoint: In(expiredEndpoints),
      });
    }
  }

  async broadcastToUser(userId: string, title: string, body: string, data?: Record<string, unknown>) {
    await this.sendPushNotification(userId, title, body, undefined, data);
  }

  getVapidPublicKey(): string | null {
    return this.configService.get<string>('VAPID_PUBLIC_KEY') || null;
  }
}
