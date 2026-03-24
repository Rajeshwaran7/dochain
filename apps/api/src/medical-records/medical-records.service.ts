import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  MedicalRecordEntry,
  Doctor,
  Patient,
  Appointment,
  AppointmentStatus,
} from '@dochain/database';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';

@Injectable()
export class MedicalRecordsService {
  constructor(
    @InjectRepository(MedicalRecordEntry) private readonly entryRepo: Repository<MedicalRecordEntry>,
    @InjectRepository(Doctor) private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(Patient) private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Appointment) private readonly appointmentRepo: Repository<Appointment>,
  ) {}

  /**
   * Ensures the doctor has at least one appointment with this patient (care relationship).
   */
  private async assertDoctorPatient(doctorId: string, patientId: string): Promise<void> {
    const n = await this.appointmentRepo.count({
      where: {
        doctorId,
        patientId,
        status: In([
          AppointmentStatus.PENDING,
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.COMPLETED,
        ]),
      },
    });
    if (n === 0) {
      throw new ForbiddenException('No appointment history with this patient.');
    }
  }

  /**
   * Lists chronological medical records for a patient (doctor view).
   */
  async listForPatientByDoctor(userId: string, patientId: string): Promise<MedicalRecordEntry[]> {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    await this.assertDoctorPatient(doctor.id, patientId);

    return this.entryRepo.find({
      where: { doctorId: doctor.id, patientId },
      order: { visitAt: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Patient reads their own records (all doctors).
   */
  async listMineAsPatient(userId: string): Promise<MedicalRecordEntry[]> {
    const patient = await this.patientRepo.findOne({ where: { userId } });
    if (!patient) throw new NotFoundException('Patient not found');

    return this.entryRepo.find({
      where: { patientId: patient.id },
      relations: ['doctor', 'doctor.user'],
      order: { visitAt: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Appends a new visit record (append-only; edits = new row with superseded chain in future).
   */
  async create(userId: string, dto: CreateMedicalRecordDto): Promise<MedicalRecordEntry> {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    await this.assertDoctorPatient(doctor.id, dto.patientId);

    if (dto.appointmentId) {
      const appt = await this.appointmentRepo.findOne({
        where: { id: dto.appointmentId, doctorId: doctor.id, patientId: dto.patientId },
      });
      if (!appt) throw new BadRequestException('Invalid appointment for this patient.');
    }

    const entry = this.entryRepo.create({
      doctorId: doctor.id,
      patientId: dto.patientId,
      appointmentId: dto.appointmentId ?? null,
      visitAt: dto.visitAt ? new Date(dto.visitAt) : new Date(),
      doctorNotes: dto.doctorNotes ?? null,
      diagnoses: dto.diagnoses?.length ? dto.diagnoses : [],
    });
    return this.entryRepo.save(entry);
  }
}
