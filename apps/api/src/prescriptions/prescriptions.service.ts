import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  BadGatewayException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import PDFDocument = require('pdfkit');
import {
  Prescription,
  PrescriptionPayload,
  Doctor,
  Patient,
  Appointment,
  AppointmentStatus,
  Clinic,
  UserRole,
} from '@dochain/database';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

@Injectable()
export class PrescriptionsService {
  private readonly logger = new Logger(PrescriptionsService.name);

  constructor(
    @InjectRepository(Prescription) private readonly prescriptionRepo: Repository<Prescription>,
    @InjectRepository(Doctor) private readonly doctorRepo: Repository<Doctor>,
    @InjectRepository(Patient) private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Appointment) private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Clinic) private readonly clinicRepo: Repository<Clinic>,
    private readonly cloudinary: CloudinaryService,
  ) {}

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
    if (n === 0) throw new ForbiddenException('No appointment history with this patient.');
  }

  /**
   * Creates a prescription row, renders a PDF, uploads to Cloudinary, and stores URLs.
   */
  async create(userId: string, dto: CreatePrescriptionDto): Promise<Prescription> {
    if (!this.cloudinary.isConfigured()) {
      throw new BadRequestException('PDF storage is not configured (Cloudinary).');
    }

    const doctor = await this.doctorRepo.findOne({
      where: { userId },
      relations: ['user', 'clinic'],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');

    await this.assertDoctorPatient(doctor.id, dto.patientId);

    if (dto.appointmentId) {
      const appt = await this.appointmentRepo.findOne({
        where: { id: dto.appointmentId, doctorId: doctor.id, patientId: dto.patientId },
      });
      if (!appt) throw new BadRequestException('Invalid appointment for this patient.');
    }

    const patient = await this.patientRepo.findOne({
      where: { id: dto.patientId },
      relations: ['user'],
    });
    if (!patient) throw new NotFoundException('Patient not found');

    const issuedAt = new Date().toISOString();
    const payload: PrescriptionPayload = {
      medicines: dto.medicines,
      instructions: dto.instructions,
      issuedAt,
    };

    const row = this.prescriptionRepo.create({
      doctorId: doctor.id,
      patientId: dto.patientId,
      appointmentId: dto.appointmentId ?? null,
      payload,
    });
    const saved = await this.prescriptionRepo.save(row);

    const clinic = doctor.clinic
      ? await this.clinicRepo.findOne({ where: { doctorId: doctor.id } })
      : null;

    const pdfBuffer = await this.renderPdf(doctor, patient, payload, clinic);

    if (pdfBuffer.length < 8 || pdfBuffer.subarray(0, 4).toString('ascii') !== '%PDF') {
      throw new BadRequestException('Generated file was not a valid PDF.');
    }

    const { secureUrl, publicId } = await this.cloudinary.uploadPdf(pdfBuffer, {
      folder: 'dochain/prescriptions',
      publicId: `rx_${saved.id}`,
    });

    saved.pdfUrl = secureUrl;
    saved.pdfPublicId = publicId;
    return this.prescriptionRepo.save(saved);
  }

  async getByIdForUser(id: string, userId: string, role: UserRole): Promise<Prescription> {
    const pres = await this.prescriptionRepo.findOne({
      where: { id },
      relations: ['doctor', 'doctor.user', 'patient', 'patient.user'],
    });
    if (!pres) throw new NotFoundException('Prescription not found');

    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    const patient = await this.patientRepo.findOne({ where: { userId } });

    if (role === UserRole.DOCTOR && doctor?.id === pres.doctorId) return pres;
    if (role === UserRole.PATIENT && patient?.id === pres.patientId) return pres;

    throw new ForbiddenException();
  }

  /**
   * Loads PDF bytes for the prescribing doctor or the patient.
   * Tries the stored `pdfUrl` first, then unsigned/signed Cloudinary URLs (follows redirects, sends User-Agent).
   */
  async getPdfBufferForUser(id: string, userId: string, role: UserRole): Promise<Buffer> {
    const pres = await this.getByIdForUser(id, userId, role);
    const pdfUrl = pres.pdfUrl ?? null;
    const publicId = pres.pdfPublicId ?? null;
    if (!pdfUrl && !publicId) {
      this.logger.warn(`Prescription ${id} has no Cloudinary URLs; generating PDF from DB payload`);
      return this.regeneratePdfBuffer(pres);
    }

    const attempts: string[] = [];
    if (this.cloudinary.isConfigured() && publicId) {
      try {
        const fromApi = await this.cloudinary.getRawResourceSecureUrl(publicId);
        if (!attempts.includes(fromApi)) attempts.push(fromApi);
      } catch (e) {
        this.logger.warn(`Cloudinary api.resource: ${(e as Error).message}`);
      }
    }
    if (pdfUrl && !attempts.includes(pdfUrl)) attempts.push(pdfUrl);
    if (this.cloudinary.isConfigured() && publicId) {
      try {
        const unsigned = this.cloudinary.getUnsignedRawDeliveryUrl(publicId);
        if (!attempts.includes(unsigned)) attempts.push(unsigned);
      } catch (e) {
        this.logger.warn(`Unsigned Cloudinary URL failed: ${(e as Error).message}`);
      }
      try {
        const signed = this.cloudinary.getSignedRawDeliveryUrl(publicId);
        if (!attempts.includes(signed)) attempts.push(signed);
      } catch (e) {
        this.logger.warn(`Signed Cloudinary URL failed: ${(e as Error).message}`);
      }
    }

    if (attempts.length === 0) {
      this.logger.warn(`Prescription ${id} has no Cloudinary URLs; generating PDF from DB payload`);
      return this.regeneratePdfBuffer(pres);
    }

    let lastError = 'unknown';
    for (const target of attempts) {
      try {
        const buf = await this.fetchRemoteBody(target);
        if (buf.length >= 8 && buf.subarray(0, 4).toString('ascii') === '%PDF') {
          return buf;
        }
        lastError = 'Response was not a PDF';
        this.logger.warn(`PDF fetch returned non-PDF from ${target.slice(0, 96)}`);
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        this.logger.warn(`PDF fetch failed: ${lastError}`);
      }
    }

    this.logger.warn(
      `All Cloudinary fetch attempts failed (last: ${lastError}); regenerating PDF from DB for ${id}`,
    );
    try {
      return await this.regeneratePdfBuffer(pres);
    } catch (e) {
      this.logger.error(`PDF regeneration failed: ${(e as Error).message}`);
      throw new BadGatewayException('Could not fetch prescription PDF from storage');
    }
  }

  /**
   * Rebuilds the PDF from stored payload (same rendering as create). Used when Cloudinary delivery fails.
   */
  private async regeneratePdfBuffer(pres: Prescription): Promise<Buffer> {
    const doctor =
      pres.doctor ??
      (await this.doctorRepo.findOne({ where: { id: pres.doctorId }, relations: ['user'] }));
    const patient =
      pres.patient ??
      (await this.patientRepo.findOne({ where: { id: pres.patientId }, relations: ['user'] }));
    if (!doctor?.user || !patient?.user) {
      throw new Error('Doctor or patient missing for PDF regeneration');
    }
    const clinic = await this.clinicRepo.findOne({ where: { doctorId: doctor.id } });
    const buf = await this.renderPdf(doctor, patient, pres.payload, clinic);
    if (buf.length < 8 || buf.subarray(0, 4).toString('ascii') !== '%PDF') {
      throw new Error('Regenerated buffer was not a valid PDF');
    }
    return buf;
  }

  async listForPatientDoctor(userId: string, patientId: string): Promise<Prescription[]> {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    await this.assertDoctorPatient(doctor.id, patientId);

    return this.prescriptionRepo.find({
      where: { doctorId: doctor.id, patientId },
      order: { createdAt: 'DESC' },
    });
  }

  async listMineAsPatient(userId: string): Promise<Prescription[]> {
    const patient = await this.patientRepo.findOne({ where: { userId } });
    if (!patient) throw new NotFoundException('Patient not found');

    return this.prescriptionRepo.find({
      where: { patientId: patient.id },
      relations: ['doctor', 'doctor.user'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Fetches remote PDF bytes using Node’s `fetch` (redirect + TLS handling is more reliable than raw `https.get`).
   */
  private async fetchRemoteBody(url: string): Promise<Buffer> {
    let href: string;
    try {
      href = new URL(url).href;
    } catch {
      throw new Error('Invalid URL');
    }

    const res = await globalThis.fetch(href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DochainAPI/1.0)',
        Accept: 'application/pdf,application/octet-stream,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(90_000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  }

  private async renderPdf(
    doctor: Doctor,
    patient: Patient,
    payload: PrescriptionPayload,
    clinic: Clinic | null,
  ): Promise<Buffer> {
    const doctorName = `${doctor.user.firstName} ${doctor.user.lastName}`;
    const patientName = `${patient.user.firstName} ${patient.user.lastName}`;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, bufferPages: false });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.font('Helvetica').fontSize(18).text('Prescription', { align: 'center' });
      doc.moveDown();
      doc.font('Helvetica').fontSize(10);
      doc.text(`Doctor: Dr. ${doctorName}`);
      if (doctor.registrationNumber) doc.text(`Reg. No: ${doctor.registrationNumber}`);
      if (clinic?.name) doc.text(`Clinic: ${clinic.name}`);
      if (clinic?.addressLine1) doc.text(`Address: ${clinic.addressLine1}, ${clinic.city ?? ''}`);
      doc.moveDown();
      doc.text(`Patient: ${patientName}`);
      doc.text(`Date: ${new Date(payload.issuedAt).toLocaleString()}`);
      doc.moveDown();
      doc.font('Helvetica').fontSize(11).text('Medicines', { underline: true });
      doc.font('Helvetica').fontSize(10);
      payload.medicines.forEach((m, i) => {
        doc.moveDown(0.3);
        doc.text(`${i + 1}. ${m.name}`);
        doc.text(`   Dosage: ${m.dosage} | Frequency: ${m.frequency} | Duration: ${m.duration}`);
        if (m.notes) doc.text(`   Notes: ${m.notes}`);
      });
      if (payload.instructions) {
        doc.moveDown();
        doc.text(`Instructions: ${payload.instructions}`);
      }
      doc.end();
    });
  }
}
