import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository, SelectQueryBuilder } from 'typeorm';
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
import { CreateAppointmentDto, RescheduleAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { DoctorSlotDto } from './dto/doctor-slot.dto';
import {
  DoctorPatientsOrder,
  DoctorPatientsQueryDto,
  DoctorPatientsSortBy,
} from './dto/doctor-patients-query.dto';
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

  /**
   * Books a slot using a DB transaction and advisory lock to prevent double booking.
   * Optional `idempotencyKey` returns the same appointment for retries.
   */
  async create(userId: string, dto: CreateAppointmentDto) {
    const patient = await this.patientRepo.findOne({ where: { userId } });
    if (!patient) throw new NotFoundException('Patient profile not found');

    const savedId = await this.appointmentRepo.manager.transaction(async (em) => {
      const lockKey = `${dto.doctorId}|${dto.appointmentDate}|${dto.startTime}`;
      await em.query(`SELECT pg_advisory_xact_lock(hashtext($1::text))`, [lockKey]);

      if (dto.idempotencyKey) {
        const byKey = await em.findOne(Appointment, { where: { idempotencyKey: dto.idempotencyKey } });
        if (byKey) {
          if (byKey.patientId !== patient.id) {
            throw new ForbiddenException('Invalid idempotency key');
          }
          return byKey.id;
        }
      }

      const duplicate = await em
        .createQueryBuilder(Appointment, 'a')
        .where('a.doctorId = :doctorId', { doctorId: dto.doctorId })
        .andWhere('a.appointmentDate = :date', { date: dto.appointmentDate })
        .andWhere('a.startTime = :startTime', { startTime: dto.startTime })
        .andWhere('a.status IN (:...statuses)', {
          statuses: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        })
        .getOne();

      if (duplicate) {
        throw new ConflictException('This slot is already booked');
      }

      const doctor = await em.findOne(Doctor, { where: { id: dto.doctorId } });
      if (!doctor) throw new NotFoundException('Doctor not found');

      const fee = doctor.consultationFee ?? 0;
      const appointment = em.create(Appointment, {
        ...dto,
        patientId: patient.id,
        fee,
        status: AppointmentStatus.PENDING,
        idempotencyKey: dto.idempotencyKey ?? null,
      });
      const saved = await em.save(appointment);
      return saved.id;
    });

    const withRelations = await this.appointmentRepo.findOne({
      where: { id: savedId },
      relations: ['doctor', 'doctor.user', 'patient', 'patient.user'],
    });
    if (!withRelations) throw new NotFoundException('Appointment not found');

    return this.finalizeNewBooking(withRelations);
  }

  /**
   * Creates Razorpay order when applicable and sends confirmation emails.
   */
  private async finalizeNewBooking(appointment: Appointment) {
    const fee = Number(appointment.fee ?? 0);
    const razorpayKeyId = this.configService.get('RAZORPAY_KEY_ID', '');
    const isRazorpayConfigured = Boolean(razorpayKeyId && !razorpayKeyId.includes('your_key'));

    if (fee > 0 && isRazorpayConfigured) {
      try {
        const order = await this.razorpay.orders.create({
          amount: Math.round(fee * 100),
          currency: 'INR',
          receipt: appointment.id,
          notes: { appointmentId: appointment.id, doctorId: appointment.doctorId },
        });

        void this.sendBookingEmails(appointment).catch((err) =>
          this.logger.warn(`Booking emails failed: ${(err as Error).message}`),
        );

        return {
          appointment,
          razorpayOrderId: order.id,
          razorpayKeyId,
          amount: Math.round(fee * 100),
        };
      } catch (err) {
        this.logger.warn(`Razorpay order creation failed: ${(err as Error).message}`);
      }
    }

    appointment.isPaid = fee === 0;
    await this.appointmentRepo.save(appointment);
    void this.sendBookingEmails(appointment).catch((err) =>
      this.logger.warn(`Booking emails failed: ${(err as Error).message}`),
    );
    return { appointment };
  }

  /**
   * Moves a booking to a new slot; uses the same lock and duplicate checks as create.
   */
  async reschedule(
    id: string,
    userId: string,
    role: UserRole,
    dto: RescheduleAppointmentDto,
  ) {
    const appointment = await this.appointmentRepo.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException('Appointment not found');

    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    const patient = await this.patientRepo.findOne({ where: { userId } });

    if (role === UserRole.DOCTOR && doctor?.id !== appointment.doctorId) {
      throw new ForbiddenException();
    }
    if (role === UserRole.PATIENT && patient?.id !== appointment.patientId) {
      throw new ForbiddenException();
    }

    if (
      appointment.status === AppointmentStatus.CANCELLED ||
      appointment.status === AppointmentStatus.COMPLETED
    ) {
      throw new BadRequestException('Cannot reschedule this appointment');
    }

    const doctorId = appointment.doctorId;

    await this.appointmentRepo.manager.transaction(async (em) => {
      const lockKey = `${doctorId}|${dto.appointmentDate}|${dto.startTime}`;
      await em.query(`SELECT pg_advisory_xact_lock(hashtext($1::text))`, [lockKey]);

      const duplicate = await em
        .createQueryBuilder(Appointment, 'a')
        .where('a.doctorId = :doctorId', { doctorId })
        .andWhere('a.appointmentDate = :date', { date: dto.appointmentDate })
        .andWhere('a.startTime = :startTime', { startTime: dto.startTime })
        .andWhere('a.status IN (:...statuses)', {
          statuses: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        })
        .andWhere('a.id != :id', { id })
        .getOne();

      if (duplicate) {
        throw new ConflictException('This slot is already booked');
      }

      await em.getRepository(Appointment).update(id, {
        appointmentDate: dto.appointmentDate as any,
        startTime: dto.startTime,
        endTime: dto.endTime,
      });
    });

    return this.appointmentRepo.findOne({
      where: { id },
      relations: ['doctor', 'doctor.user', 'patient', 'patient.user'],
    });
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

  private applyDoctorPatientFilters(
    qb: SelectQueryBuilder<Appointment>,
    doctorId: string,
    dto: DoctorPatientsQueryDto,
  ): void {
    qb.innerJoin('a.patient', 'patient')
      .innerJoin('patient.user', 'user')
      .where('a.doctorId = :doctorId', { doctorId })
      .andWhere('a.status = :status', { status: AppointmentStatus.COMPLETED });

    if (dto.dateFrom) {
      qb.andWhere('a.appointmentDate >= :dateFrom', { dateFrom: dto.dateFrom });
    }
    if (dto.dateTo) {
      qb.andWhere('a.appointmentDate <= :dateTo', { dateTo: dto.dateTo });
    }

    const q = dto.q?.trim();
    if (q) {
      const like = `%${q.toLowerCase()}%`;
      qb.andWhere(
        new Brackets((w) => {
          w.where('LOWER(CONCAT(user.firstName, \' \', user.lastName)) LIKE :like', { like })
            .orWhere('LOWER(user.email) LIKE :like', { like })
            .orWhere('LOWER(COALESCE(user.phone, \'\')) LIKE :like', { like });
        }),
      );
    }
  }

  /**
   * Paginated patients with completed visits (search, date range, sort, and pagination in the database).
   */
  async getDoctorPatients(userId: string, dto: DoctorPatientsQueryDto) {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    if (dto.dateFrom && dto.dateTo && dto.dateFrom > dto.dateTo) {
      throw new BadRequestException('dateFrom must be before or equal to dateTo');
    }

    const page = dto.page ?? 1;
    const limit = Math.min(dto.limit ?? 8, 50);

    const countQb = this.appointmentRepo.createQueryBuilder('a');
    this.applyDoctorPatientFilters(countQb, doctor.id, dto);
    const countRow = await countQb.select('COUNT(DISTINCT a.patientId)', 'cnt').getRawOne();
    const total = parseInt(String(countRow?.cnt ?? 0), 10);

    const listQb = this.appointmentRepo.createQueryBuilder('a');
    this.applyDoctorPatientFilters(listQb, doctor.id, dto);
    listQb
      .select('a.patientId', 'patientId')
      .addSelect('MAX(a.appointmentDate)', 'lastVisitDate')
      .addSelect('COUNT(*)', 'visitCount')
      .groupBy('a.patientId');

    const sortBy = dto.sortBy ?? DoctorPatientsSortBy.LAST_VISIT;
    const order = dto.order ?? DoctorPatientsOrder.DESC;

    if (sortBy === DoctorPatientsSortBy.NAME) {
      const dir = order === DoctorPatientsOrder.ASC ? 'ASC' : 'DESC';
      listQb.orderBy('MIN(user.firstName)', dir).addOrderBy('MIN(user.lastName)', dir);
    } else {
      const dir = order === DoctorPatientsOrder.ASC ? 'ASC' : 'DESC';
      listQb.orderBy('MAX(a.appointmentDate)', dir);
    }

    listQb.skip((page - 1) * limit).take(limit);

    const raw = await listQb.getRawMany();

    if (raw.length === 0) {
      return {
        items: [],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 0,
      };
    }

    const ids = raw.map((r) => String(r.patientId));
    const patients = await this.patientRepo.find({
      where: { id: In(ids) },
      relations: ['user'],
    });
    const byId = new Map(patients.map((p) => [p.id, p]));

    const items = raw.map((row) => {
      const pid = String(row.patientId);
      const p = byId.get(pid);
      const lastVisit = row.lastVisitDate as Date | string;
      const lastVisitDate =
        lastVisit instanceof Date
          ? lastVisit.toISOString().split('T')[0]
          : String(lastVisit).split('T')[0];
      const visitCount = parseInt(String(row.visitCount), 10);
      return {
        patientId: pid,
        lastVisitDate,
        visitCount: Number.isFinite(visitCount) ? visitCount : 0,
        patient: p ?? null,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
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

  /**
   * Lists every slot in the doctor's schedule for the date with UI status (available / booked / completed / past).
   * Normalizes DB times (e.g. 09:00:00) to HH:mm so booked slots match generated keys.
   */
  async getAvailableSlots(doctorId: string, date: string): Promise<DoctorSlotDto[]> {
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
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayOfWeek = dayNames[d.getDay()];
      const availability = doctor.availabilities?.find(
        (a) => a.dayOfWeek === dayOfWeek && a.isActive,
      );
      duration = availability?.slotDurationMinutes ?? 15;
    } else {
      const d = new Date(date);
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayOfWeek = dayNames[d.getDay()];
      const availability = doctor.availabilities?.find(
        (a) => a.dayOfWeek === dayOfWeek && a.isActive,
      );
      if (!availability) return [];
      startTime = availability.startTime;
      endTime = availability.endTime;
      duration = availability.slotDurationMinutes;
    }

    const slotTimes = this.enumerateSlotTimes(startTime, endTime, duration);

    const dayAppointments = await this.appointmentRepo.find({
      where: { doctorId, appointmentDate: date as any },
      select: ['startTime', 'status'],
    });

    const statusBySlot = new Map<string, AppointmentStatus>();
    for (const a of dayAppointments) {
      const key = AppointmentsService.normalizeSlotTime(a.startTime);
      const merged = AppointmentsService.mergeAppointmentStatus(statusBySlot.get(key), a.status);
      statusBySlot.set(key, merged);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = date === todayStr;

    return slotTimes.map((time): DoctorSlotDto => {
      if (isToday && AppointmentsService.isSlotInPast(date, time)) {
        return { time, status: 'past' };
      }
      const apptStatus = statusBySlot.get(time);
      if (apptStatus === AppointmentStatus.PENDING || apptStatus === AppointmentStatus.CONFIRMED) {
        return { time, status: 'booked' };
      }
      if (apptStatus === AppointmentStatus.COMPLETED || apptStatus === AppointmentStatus.NO_SHOW) {
        return { time, status: 'completed' };
      }
      return { time, status: 'available' };
    });
  }

  private static normalizeSlotTime(raw: string): string {
    const parts = raw.split(':');
    const h = (parts[0] ?? '0').padStart(2, '0');
    const m = (parts[1] ?? '0').padStart(2, '0');
    return `${h}:${m}`;
  }

  private static mergeAppointmentStatus(
    existing: AppointmentStatus | undefined,
    next: AppointmentStatus,
  ): AppointmentStatus {
    if (!existing) return next;
    const rank = (s: AppointmentStatus) => {
      if (s === AppointmentStatus.PENDING || s === AppointmentStatus.CONFIRMED) return 3;
      if (s === AppointmentStatus.COMPLETED || s === AppointmentStatus.NO_SHOW) return 2;
      return 0;
    };
    return rank(next) > rank(existing) ? next : existing;
  }

  private static isSlotInPast(dateStr: string, timeStr: string): boolean {
    const [y, mo, d] = dateStr.split('-').map(Number);
    const [h, mi] = timeStr.split(':').map(Number);
    const slotStart = new Date(y, mo - 1, d, h, mi, 0, 0);
    return slotStart.getTime() < Date.now();
  }

  private enumerateSlotTimes(startTime: string, endTime: string, durationMinutes: number): string[] {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const slots: string[] = [];
    let current = startH * 60 + startM;
    const end = endH * 60 + endM;
    while (current + durationMinutes <= end) {
      const h = Math.floor(current / 60).toString().padStart(2, '0');
      const m = (current % 60).toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
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

    const patientRow = await this.appointmentRepo
      .createQueryBuilder('a')
      .select('COUNT(DISTINCT a.patientId)', 'cnt')
      .where('a.doctorId = :doctorId', { doctorId: doctor.id })
      .andWhere('a.status = :status', { status: AppointmentStatus.COMPLETED })
      .getRawOne();
    const totalPatients = parseInt(String(patientRow?.cnt ?? 0), 10);

    return { total, totalPatients, todayCount, completed, pending };
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
