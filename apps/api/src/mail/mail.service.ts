import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

/** Handles all outbound email delivery via SMTP using Handlebars templates. */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly templateDir: string;
  private readonly appName: string;

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
    this.appName = this.config.get('APP_NAME', 'Dochain');
    this.templateDir = this.resolveTemplateDir();
  }

  /**
   * Resolves the directory containing .hbs templates.
   * Tries: same dir as compiled mail module, cwd/dist/mail/templates, then dist relative to __dirname.
   */
  private resolveTemplateDir(): string {
    const candidates = [
      path.join(__dirname, 'templates'),
      path.join(process.cwd(), 'dist', 'mail', 'templates'),
      path.join(__dirname, '..', '..', '..', '..', 'mail', 'templates'),
    ];
    const layoutName = 'layout.hbs';
    for (const dir of candidates) {
      const layoutPath = path.join(dir, layoutName);
      if (fs.existsSync(layoutPath)) return dir;
    }
    return candidates[0];
  }

  /** Sends an email and logs failures without throwing. */
  async send(options: SendMailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"${this.appName}" <${this.config.get('SMTP_FROM', 'noreply@dochain.in')}>`,
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

  /**
   * Renders an email using the shared layout and the given content template.
   * @param contentTemplate - Template filename (e.g. 'verification.hbs')
   * @param title - Email title for layout
   * @param context - Data for the content template (and layout appName/title)
   */
  private renderEmail(contentTemplate: string, title: string, context: Record<string, unknown>): string {
    const layoutPath = path.join(this.templateDir, 'layout.hbs');
    const contentPath = path.join(this.templateDir, contentTemplate);
    if (!fs.existsSync(layoutPath) || !fs.existsSync(contentPath)) {
      this.logger.warn(`Missing template: ${layoutPath} or ${contentPath}, using fallback`);
      return `<p>${title}</p><div>${JSON.stringify(context)}</div>`;
    }
    const layoutSrc = fs.readFileSync(layoutPath, 'utf-8');
    const contentSrc = fs.readFileSync(contentPath, 'utf-8');
    const contentFn = Handlebars.compile(contentSrc);
    const body = contentFn({ ...context, appName: this.appName });
    const layoutFn = Handlebars.compile(layoutSrc);
    return layoutFn({
      ...context,
      appName: this.appName,
      title,
      body: new Handlebars.SafeString(body),
    });
  }

  /** Sends an email verification link to the user. Uses baseUrl for role-specific app (patient vs doctor). */
  async sendVerificationEmail(
    email: string,
    firstName: string,
    token: string,
    baseUrl?: string,
  ): Promise<boolean> {
    const appUrl = baseUrl ?? this.config.get('PATIENT_APP_URL', 'http://localhost:3001');
    const verifyUrl = `${appUrl}/auth/verify-email?token=${token}`;
    const html = this.renderEmail('verification.hbs', 'Verify your email', {
      firstName,
      verifyUrl,
    });
    return this.send({
      to: email,
      subject: `Verify your email - ${this.appName}`,
      html,
    });
  }

  /** Sends a password reset link to the user. Uses baseUrl for role-specific app (patient vs doctor). */
  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    token: string,
    baseUrl?: string,
  ): Promise<boolean> {
    const appUrl = baseUrl ?? this.config.get('PATIENT_APP_URL', 'http://localhost:3001');
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;
    const html = this.renderEmail('password-reset.hbs', 'Reset your password', {
      firstName,
      resetUrl,
    });
    return this.send({
      to: email,
      subject: `Reset your password - ${this.appName}`,
      html,
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
    const html = this.renderEmail('appointment-reminder.hbs', 'Appointment Reminder', {
      patientName,
      doctorName,
      date,
      time,
    });
    return this.send({
      to: email,
      subject: `Appointment Reminder - ${this.appName}`,
      html,
    });
  }

  /** Notifies patient that their appointment request was received (pending doctor confirmation). */
  async sendAppointmentBookedToPatient(
    email: string,
    patientName: string,
    doctorName: string,
    date: string,
    time: string,
  ): Promise<boolean> {
    const html = this.renderEmail('appointment-booked.hbs', 'Appointment Request Received', {
      patientName,
      doctorName,
      date,
      time,
    });
    return this.send({
      to: email,
      subject: `Appointment Request Received - ${this.appName}`,
      html,
    });
  }

  /** Notifies doctor of a new appointment request. */
  async sendNewAppointmentToDoctor(
    email: string,
    doctorName: string,
    patientName: string,
    date: string,
    time: string,
    symptoms?: string,
  ): Promise<boolean> {
    const html = this.renderEmail('appointment-notify-doctor.hbs', 'New Appointment Request', {
      doctorName,
      patientName,
      date,
      time,
      symptoms: symptoms ?? '',
    });
    return this.send({
      to: email,
      subject: `New Appointment Request - ${this.appName}`,
      html,
    });
  }

  /** Notifies patient that doctor confirmed the appointment. */
  async sendAppointmentConfirmed(
    email: string,
    patientName: string,
    doctorName: string,
    date: string,
    time: string,
  ): Promise<boolean> {
    const html = this.renderEmail('appointment-confirmed.hbs', 'Appointment Confirmed', {
      patientName,
      doctorName,
      date,
      time,
    });
    return this.send({
      to: email,
      subject: `Appointment Confirmed - ${this.appName}`,
      html,
    });
  }

  /** Notifies patient or doctor that an appointment was cancelled. */
  async sendAppointmentCancelled(
    email: string,
    recipientName: string,
    otherPartyName: string,
    date: string,
    time: string,
    isForPatient: boolean,
    reason?: string,
  ): Promise<boolean> {
    const html = this.renderEmail('appointment-cancelled.hbs', 'Appointment Cancelled', {
      recipientName,
      otherPartyName,
      date,
      time,
      isForPatient,
      reason: reason ?? '',
    });
    return this.send({
      to: email,
      subject: `Appointment Cancelled - ${this.appName}`,
      html,
    });
  }
}
