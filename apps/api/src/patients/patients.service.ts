import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '@dochain/database';
import { UpdatePatientDto } from './dto/update-patient.dto';

/** Handles patient profile retrieval and updates. */
@Injectable()
export class PatientsService {
  constructor(@InjectRepository(Patient) private patientRepo: Repository<Patient>) {}

  /** Fetches a patient profile by the owning user's ID. */
  async getProfile(userId: string) {
    const patient = await this.patientRepo.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!patient) throw new NotFoundException('Patient profile not found');
    return patient;
  }

  /** Updates only the allowed patient profile fields. */
  async updateProfile(userId: string, dto: UpdatePatientDto) {
    const patient = await this.patientRepo.findOne({ where: { userId } });
    if (!patient) throw new NotFoundException('Patient not found');
    Object.assign(patient, dto);
    return this.patientRepo.save(patient);
  }
}
