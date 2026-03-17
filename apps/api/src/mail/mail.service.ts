import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

/** Handles all outbound email delivery via SMTP. */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST', 'smtp.gmail.com'),
      port: this.config.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });
  }

  /** Sends an email and logs failures without throwing. */
  async send(options: SendMailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"${this.config.get('APP_NAME', 'Dochain')}" <${this.config.get('SMTP_FROM', 'noreply@dochain.in')}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${(error as Error).message}`);
      return false;
    }
  }

  /** Sends an email verification link to the user. */
  async sendVerificationEmail(email: string, firstName: string, token: string): Promise<boolean> {
    const appUrl = this.config.get('PATIENT_APP_URL', 'http://localhost:3001');
    const verifyUrl = `${appUrl}/auth/verify-email?token=${token}`;

    return this.send({
      to: email,
      subject: 'Verify your email - Dochain',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0f172a;">Welcome to Dochain, ${firstName}!</h2>
          <p>Please verify your email address by clicking the button below:</p>
          <a href="${verifyUrl}"
             style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px;
                    border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Verify Email
          </a>
          <p style="color: #64748b; font-size: 14px;">
            If the button doesn't work, copy and paste this link:<br/>
            <a href="${verifyUrl}">${verifyUrl}</a>
          </p>
          <p style="color: #94a3b8; font-size: 12px;">This link expires in 24 hours.</p>
        </div>
      `,
    });
  }

  /** Sends a password reset link to the user. */
  async sendPasswordResetEmail(email: string, firstName: string, token: string): Promise<boolean> {
    const appUrl = this.config.get('PATIENT_APP_URL', 'http://localhost:3001');
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

    return this.send({
      to: email,
      subject: 'Reset your password - Dochain',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0f172a;">Password Reset</h2>
          <p>Hi ${firstName}, we received a request to reset your password.</p>
          <a href="${resetUrl}"
             style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px;
                    border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #64748b; font-size: 14px;">
            If the button doesn't work, copy and paste this link:<br/>
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
          <p style="color: #94a3b8; font-size: 12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
  }

  /** Sends an appointment reminder email. */
  async sendAppointmentReminder(
    email: string,
    patientName: string,
    doctorName: string,
    date: string,
    time: string,
  ): Promise<boolean> {
    return this.send({
      to: email,
      subject: 'Appointment Reminder - Dochain',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0f172a;">Appointment Reminder</h2>
          <p>Hi ${patientName}, this is a reminder for your upcoming appointment:</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Doctor:</strong> Dr. ${doctorName}</p>
            <p style="margin: 4px 0;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 4px 0;"><strong>Time:</strong> ${time}</p>
          </div>
          <p style="color: #64748b; font-size: 14px;">Please arrive 10 minutes before your scheduled time.</p>
        </div>
      `,
    });
  }
}
