import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  User, Doctor, Patient, Appointment, Subscription,
  DoctorStatus, AppointmentStatus, SubscriptionStatus,
} from '@dochain/database';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Doctor) private doctorRepo: Repository<Doctor>,
    @InjectRepository(Patient) private patientRepo: Repository<Patient>,
    @InjectRepository(Appointment) private appointmentRepo: Repository<Appointment>,
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
  ) {}

  async getDashboardStats() {
    const [totalDoctors, pendingDoctors, approvedDoctors] = await Promise.all([
      this.doctorRepo.count(),
      this.doctorRepo.count({ where: { status: DoctorStatus.PENDING } }),
      this.doctorRepo.count({ where: { status: DoctorStatus.APPROVED } }),
    ]);

    const [totalPatients, totalAppointments, completedAppointments] = await Promise.all([
      this.patientRepo.count(),
      this.appointmentRepo.count(),
      this.appointmentRepo.count({ where: { status: AppointmentStatus.COMPLETED } }),
    ]);

    const activeSubscriptions = await this.subRepo.count({
      where: { status: SubscriptionStatus.ACTIVE },
    });

    // Monthly revenue (sum of active subscription amounts)
    const revenueResult = await this.subRepo
      .createQueryBuilder('sub')
      .select('SUM(sub.amount)', 'total')
      .where('sub.status = :status', { status: SubscriptionStatus.ACTIVE })
      .getRawOne();

    // Monthly appointment trend (last 6 months)
    const monthlyData = await this.appointmentRepo
      .createQueryBuilder('appt')
      .select("TO_CHAR(appt.createdAt, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .where("appt.createdAt >= NOW() - INTERVAL '6 months'")
      .groupBy("TO_CHAR(appt.createdAt, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .getRawMany();

    return {
      doctors: { total: totalDoctors, pending: pendingDoctors, approved: approvedDoctors },
      patients: { total: totalPatients },
      appointments: { total: totalAppointments, completed: completedAppointments },
      subscriptions: { active: activeSubscriptions },
      revenue: { monthly: parseFloat(revenueResult?.total) || 0 },
      monthlyAppointments: monthlyData,
    };
  }

  async listDoctors(status?: DoctorStatus, page = 1, limit = 20) {
    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await this.doctorRepo.findAndCount({
      where,
      relations: ['user', 'clinic'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async approveDoctor(id: string) {
    const doctor = await this.doctorRepo.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    doctor.status = DoctorStatus.APPROVED;
    return this.doctorRepo.save(doctor);
  }

  async rejectDoctor(id: string, reason?: string) {
    const doctor = await this.doctorRepo.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    doctor.status = DoctorStatus.REJECTED;
    return this.doctorRepo.save(doctor);
  }

  async suspendDoctor(id: string) {
    const doctor = await this.doctorRepo.findOne({ where: { id } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    doctor.status = DoctorStatus.SUSPENDED;
    return this.doctorRepo.save(doctor);
  }

  async listPatients(page = 1, limit = 20) {
    const [data, total] = await this.patientRepo.findAndCount({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async listSubscriptions(page = 1, limit = 20) {
    const [data, total] = await this.subRepo.findAndCount({
      relations: ['doctor', 'doctor.user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async toggleUserActive(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    user.isActive = !user.isActive;
    return this.userRepo.save(user);
  }
}
