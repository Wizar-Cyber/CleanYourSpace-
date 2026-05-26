import { z } from 'zod';
import { NotificationType } from './enums';

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  recipientId: z.string().uuid().nullable(),
  type: z.nativeEnum(NotificationType),
  title: z.string(),
  body: z.string(),
  data: z.record(z.unknown()).nullable(),
  relatedServiceId: z.string().uuid().nullable(),
  relatedAlertId: z.string().uuid().nullable(),
  read: z.boolean(),
  createdAt: z.string().datetime(),
  readAt: z.string().datetime().nullable(),
});

export type Notification = z.infer<typeof NotificationSchema>;

export const CreateNotificationDto = z.object({
  userId: z.string().uuid(),
  recipientId: z.string().uuid().nullable().optional(),
  type: z.nativeEnum(NotificationType),
  title: z.string(),
  body: z.string(),
  data: z.record(z.unknown()).nullable().optional(),
  relatedServiceId: z.string().uuid().nullable().optional(),
  relatedAlertId: z.string().uuid().nullable().optional(),
});

export type CreateNotificationDto = z.infer<typeof CreateNotificationDto>;

export const PushSubscriptionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  endpoint: z.string(),
  p256dh: z.string(),
  auth: z.string(),
  userAgent: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type PushSubscription = z.infer<typeof PushSubscriptionSchema>;

export const RegisterPushSubscriptionDto = z.object({
  endpoint: z.string(),
  p256dh: z.string(),
  auth: z.string(),
  userAgent: z.string().optional(),
});

export type RegisterPushSubscriptionDto = z.infer<typeof RegisterPushSubscriptionDto>;

export const SendPushNotificationDto = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  icon: z.string().optional(),
  data: z.record(z.unknown()).optional(),
});

export type SendPushNotificationDto = z.infer<typeof SendPushNotificationDto>;
