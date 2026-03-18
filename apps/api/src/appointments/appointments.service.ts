import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Appointment,
  AppointmentStatus,
  AvailabilityException,
  Doctor,
  Patient,
  UserRole,
} from '@dochain/database';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import * as crypto from 'crypto';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);
  private razorpay: { orders: { create: (opts: Record<string, unknown>) => Promise<{ id: string }> } };

  constructor(
    @InjectRepository(Appointment) private appointmentRepo: Repository<Appointment>,
    @InjectRepository(Doctor) private doctorRepo: Repository<Doctor>,
    @InjectRepository(Patient) private patientRepo: Repository<Patient>,
    @InjectRepository(AvailabilityException) private exceptionRepo: Repository<AvailabilityException>,
    private mailService: MailService,
    private configService: ConfigService,
  ) {
    const Razorpay = require('razorpay');
    this.razorpay = new Razorpay({
      key_id: this.configService.get('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get('RAZORPAY_KEY_SECRET'),
    });
  }

  /** Books an appointment and creates a Razorpay order for payment. */
  async create(userId: string, dto: CreateAppointmentDto) {
    const patient = await this.patientRepo.findOne({ where: { userId } });
    if (!patient) throw new NotFoundException('Patient profile not found');

    const doctor = await this.doctorRepo.findOne({ where: { id: dto.doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const existing = await this.appointmentRepo
      .createQueryBuilder('a')
      .where('a.doctorId = :doctorId', { doctorId: dto.doctorId })
      .andWhere('a.appointmentDate = :date', { date: dto.appointmentDate })
      .andWhere('a.startTime = :startTime', { startTime: dto.startTime })
      .andWhere('a.status IN (:...statuses)', {
        statuses: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      })
      .getOne();
    if (existing) throw new BadRequestException('This slot is already booked');

    const fee = doctor.consultationFee ?? 0;

    const appointment = this.appointmentRepo.create({
      ...dto,
      patientId: patient.id,
      fee,
      status: AppointmentStatus.PENDING,
    });
    const saved = await this.appointmentRepo.save(appointment);

    const razorpayKeyId = this.configService.get('RAZORPAY_KEY_ID', '');
    const isRazorpayConfigured = razorpayKeyId && !razorpayKeyId.includes('your_key');

    if (fee > 0 && isRazorpayConfigured) {
      try {
        const order = await this.razorpay.orders.create({
          amount: Math.round(fee * 100),
          currency: 'INR',
          receipt: saved.id,
          notes: { appointmentId: saved.id, doctorId: dto.doctorId },
        });

        const withRelations = await this.appointmentRepo.findOne({
          where: { id: saved.id },
          relations: ['doctor', 'doctor.user', 'patient', 'patient.user'],
        });
        if (withRelations) this.sendBookingEmails(withRelations);

        return {
          appointment: saved,
          razorpayOrderId: order.id,
          razorpayKeyId,
          amount: Math.round(fee * 100),
        };
      } catch (err) {
        this.logger.warn(`Razorpay order creation failed: ${(err as Error).message}`);
      }
    }

    saved.isPaid = fee === 0;
    await this.appointmentRepo.save(saved);
    const withRelations = await this.appointmentRepo.findOne({
      where: { id: saved.id },
      relations: ['doctor', 'doctor.user', 'patient', 'patient.user'],
    });
    if (withRelations) this.sendBookingEmails(withRelations);
    return { appointment: saved };
  }

  /** Sends booking confirmation to patient and new-request notification to doctor. */
  private async sendBookingEmails(appt: Appointment) {
    const patientName = `${appt.patient.user.firstName} ${appt.patient.user.lastName}`;
    const doctorName = `${appt.doctor.user.firstName} ${appt.doctor.user.lastName}`;
    const dateStr = String(appt.appointmentDate);
    await this.mailService.sendAppointmentBookedToPatient(
      appt.patient.user.email,
      patientName,
      doctorName,
      dateStr,
      appt.startTime,
    );
    await this.mailService.sendNewAppointmentToDoctor(
      appt.doctor.user.email,
      doctorName,
      patientName,
      dateStr,
      appt.startTime,
      appt.symptoms ?? undefined,
    );
  }

  /** Verifies Razorpay payment signature and confirms the appointment. */
  async verifyPayment(
    appointmentId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) {
    const appointment = await this.appointmentRepo.findOne({ where: { id: appointmentId } });
    if (!appointment) throw new NotFoundException('Appointment not found');

    const secret = this.configService.get('RAZORPAY_KEY_SECRET', '');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      throw new BadRequestException('Payment verification failed');
    }

    appointment.isPaid = true;
    appointment.paymentId = razorpayPaymentId;
    return this.appointmentRepo.save(appointment);
  }

  async getPatientAppointments(userId: string, status?: AppointmentStatus) {
    const patient = await this.patientRepo.findOne({ where: { userId } });
    if (!patient) throw new NotFoundException('Patient not found');

    const where: any = { patientId: patient.id };
    if (status) where.status = status;

    return this.appointmentRepo.find({
      where,
      relations: ['doctor', 'doctor.user'],
      order: { appointmentDate: 'DESC', startTime: 'DESC' },
    });
  }

  async getDoctorAppointments(userId: string, date?: string, status?: AppointmentStatus) {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const where: any = { doctorId: doctor.id };
    if (status) where.status = status;
    if (date) where.appointmentDate = date;

    return this.appointmentRepo.find({
      where,
      relations: ['patient', 'patient.user'],
      order: { appointmentDate: 'ASC', startTime: 'ASC' },
    });
  }

  async updateStatus(
    id: string,
    userId: string,
    userRole: UserRole,
    dto: UpdateAppointmentStatusDto,
  ) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
      relations: ['doctor', 'doctor.user', 'patient', 'patient.user'],
    });
    if (!appointment) throw new NotFoundException('Appointment not found');

    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    const patient = await this.patientRepo.findOne({ where: { userId } });

    if (
      userRole === UserRole.DOCTOR &&
      doctor?.id !== appointment.doctorId
    ) throw new ForbiddenException();

    if (
      userRole === UserRole.PATIENT &&
      patient?.id !== appointment.patientId
    ) throw new ForbiddenException();

    if (userRole === UserRole.PATIENT && dto.status !== AppointmentStatus.CANCELLED) {
      throw new ForbiddenException('Patients can only cancel appointments. Confirmation is done by the doctor.');
    }

    const previousStatus = appointment.status;
    appointment.status = dto.status;
    if (dto.notes) appointment.doctorNotes = dto.notes;
    if (dto.cancellationReason) appointment.cancellationReason = dto.cancellationReason;

    const saved = await this.appointmentRepo.save(appointment);
    this.sendStatusChangeEmails(appointment, previousStatus, dto.status).catch((err) =>
      this.logger.warn(`Status change emails failed: ${(err as Error).message}`),
    );
    return saved;
  }

  /** Sends confirm/cancel emails when status changes. */
  private async sendStatusChangeEmails(
    appt: Appointment,
    previousStatus: AppointmentStatus,
    newStatus: AppointmentStatus,
  ) {
    const patientName = `${appt.patient.user.firstName} ${appt.patient.user.lastName}`;
    const doctorName = `${appt.doctor.user.firstName} ${appt.doctor.user.lastName}`;
    const dateStr = String(appt.appointmentDate);

    if (newStatus === AppointmentStatus.CONFIRMED && previousStatus !== AppointmentStatus.CONFIRMED) {
      await this.mailService.sendAppointmentConfirmed(
        appt.patient.user.email,
        patientName,
        doctorName,
        dateStr,
        appt.startTime,
      );
    }

    if (newStatus === AppointmentStatus.CANCELLED) {
      await this.mailService.sendAppointmentCancelled(
        appt.patient.user.email,
        patientName,
        doctorName,
        dateStr,
        appt.startTime,
        true,
        appt.cancellationReason ?? undefined,
      );
      await this.mailService.sendAppointmentCancelled(
        appt.doctor.user.email,
        doctorName,
        patientName,
        dateStr,
        appt.startTime,
        false,
        appt.cancellationReason ?? undefined,
      );
    }
  }

  async getById(id: string) {
    const appt = await this.appointmentRepo.findOne({
      where: { id },
      relations: ['doctor', 'doctor.user', 'patient', 'patient.user'],
    });
    if (!appt) throw new NotFoundException('Appointment not found');
    return appt;
  }

  /** Generates available time slots for a doctor on a given date, respecting exceptions. */
  async getAvailableSlots(doctorId: string, date: string): Promise<string[]> {
    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId },
      relations: ['availabilities'],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const exception = await this.exceptionRepo.findOne({
      where: { doctorId, date: date as any },
    });

    if (exception?.isHoliday) return [];

    let startTime: string;
    let endTime: string;
    let duration: number;

    if (exception?.customStartTime && exception?.customEndTime) {
      startTime = exception.customStartTime;
      endTime = exception.customEndTime;
      const d = new Date(date);
      const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
      const dayOfWeek = dayNames[d.getDay()];
      const availability = doctor.availabilities?.find(
        (a) => a.dayOfWeek === dayOfWeek && a.isActive,
      );
      duration = availability?.slotDurationMinutes ?? 15;
    } else {
      const d = new Date(date);
      const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
      const dayOfWeek = dayNames[d.getDay()];
      const availability = doctor.availabilities?.find(
        (a) => a.dayOfWeek === dayOfWeek && a.isActive,
      );
      if (!availability) return [];
      startTime = availability.startTime;
      endTime = availability.endTime;
      duration = availability.slotDurationMinutes;
    }

    const bookedSlots = await this.appointmentRepo
      .createQueryBuilder('a')
      .select('a.startTime')
      .where('a.doctorId = :doctorId', { doctorId })
      .andWhere('a.appointmentDate = :date', { date })
      .andWhere('a.status IN (:...statuses)', {
        statuses: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      })
      .getMany();

    const booked = new Set(bookedSlots.map((a) => a.startTime));
    return this.generateTimeSlots(startTime, endTime, duration, booked);
  }

  private generateTimeSlots(
    startTime: string,
    endTime: string,
    durationMinutes: number,
    booked: Set<string>,
  ): string[] {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const slots: string[] = [];
    let current = startH * 60 + startM;
    const end = endH * 60 + endM;

    while (current + durationMinutes <= end) {
      const h = Math.floor(current / 60).toString().padStart(2, '0');
      const m = (current % 60).toString().padStart(2, '0');
      const slotTime = `${h}:${m}`;
      if (!booked.has(slotTime)) slots.push(slotTime);
      current += durationMinutes;
    }

    return slots;
  }

  // Cron: send reminders for tomorrow's appointments
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendAppointmentReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const appointments = await this.appointmentRepo.find({
      where: {
        appointmentDate: dateStr as any,
        status: AppointmentStatus.CONFIRMED,
        reminderSentAt: null as any,
      },
      relations: ['patient', 'patient.user', 'doctor', 'doctor.user'],
    });

    for (const appt of appointments) {
      const patientName = `${appt.patient.user.firstName} ${appt.patient.user.lastName}`;
      const doctorName = `${appt.doctor.user.firstName} ${appt.doctor.user.lastName}`;

      await this.mailService.sendAppointmentReminder(
        appt.patient.user.email,
        patientName,
        doctorName,
        String(appt.appointmentDate),
        appt.startTime,
      );

      appt.reminderSentAt = new Date();
      await this.appointmentRepo.save(appt);
      this.logger.log(`Reminder sent for appointment ${appt.id}`);
    }
  }

  async getDoctorStats(userId: string) {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const total = await this.appointmentRepo.count({ where: { doctorId: doctor.id } });
    const today = new Date().toISOString().split('T')[0];
    const todayCount = await this.appointmentRepo.count({
      where: { doctorId: doctor.id, appointmentDate: today as any },
    });
    const completed = await this.appointmentRepo.count({
      where: { doctorId: doctor.id, status: AppointmentStatus.COMPLETED },
    });
    const pending = await this.appointmentRepo.count({
      where: { doctorId: doctor.id, status: AppointmentStatus.PENDING },
    });

    return { total, todayCount, completed, pending };
  }

  /** Returns appointment counts grouped by month for the last 6 months. */
  async getDoctorMonthlyStats(userId: string) {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const data = await this.appointmentRepo
      .createQueryBuilder('appt')
      .select("TO_CHAR(appt.createdAt, 'Mon')", 'month')
      .addSelect('COUNT(*)', 'appointments')
      .where('appt.doctorId = :doctorId', { doctorId: doctor.id })
      .andWhere("appt.createdAt >= NOW() - INTERVAL '6 months'")
      .groupBy("TO_CHAR(appt.createdAt, 'YYYY-MM'), TO_CHAR(appt.createdAt, 'Mon')")
      .orderBy("TO_CHAR(appt.createdAt, 'YYYY-MM')", 'ASC')
      .getRawMany();

    return data.map((row) => ({
      month: row.month?.trim(),
      appointments: parseInt(row.appointments, 10),
    }));
  }
}
