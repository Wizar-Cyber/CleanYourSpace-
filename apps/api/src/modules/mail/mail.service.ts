import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) return this.transporter;

    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<string>('SMTP_PORT', '587');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!user) {
      this.logger.warn('SMTP_USER not configured — email sending is disabled');
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      auth: { user, pass },
    });

    return this.transporter;
  }

  // ── RF-071: Send notification email to a user ──

  async sendNotificationEmail(userId: string, subject: string, textBody: string): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) return;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.email) {
      this.logger.warn(`User ${userId} has no email — skipping notification`);
      return;
    }

    await transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM', 'notifications@corecon.us'),
      to: user.email,
      subject: `[Corecon] ${subject}`,
      html: this.buildEmailTemplate(subject, textBody, user.firstName),
    });
  }

  // ── RF-071: Send notification email to an arbitrary address ──

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) return;

    await transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM', 'notifications@corecon.us'),
      to,
      subject: `[Corecon] ${subject}`,
      html,
    });
  }

  // ── Legacy: Password reset email ──

  async sendPasswordResetEmail(to: string, token: string, name: string): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) return;

    const appUrl = this.configService.get<string>('CLEANER_APP_URL', 'http://localhost:5173');
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    await this.sendEmail(to, 'Password Recovery / Recuperación de contraseña', `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; padding: 24px;">
        <h2>Recuperación de contraseña</h2>
        <p>Hola <strong>${name}</strong>,</p>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
        <p><a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">Restablecer contraseña</a></p>
        <p>Este enlace expira en <strong>30 minutos</strong>.</p>
        <p>Si no solicitaste este cambio, ignora este mensaje.</p>
        <hr>
        <h2>Password Recovery</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>You requested a password reset. Click the link below to proceed:</p>
        <p><a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
        <p>This link expires in <strong>30 minutes</strong>.</p>
        <p>If you did not request this change, please ignore this message.</p>
      </body>
      </html>
    `);
  }

  // ── Helpers ──

  private buildEmailTemplate(subject: string, body: string, name: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto;">
        <div style="background: #B8860B; color: #fff; padding: 16px 24px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 18px;">Corecon</h2>
        </div>
        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p>Hello <strong>${name}</strong>,</p>
          <p>${body}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px;">This is an automated message from Corecon. Please do not reply.</p>
        </div>
      </body>
      </html>
    `;
  }
}
