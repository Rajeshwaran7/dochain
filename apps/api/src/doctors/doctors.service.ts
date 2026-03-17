import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { Doctor, Clinic, DoctorStatus } from '@dochain/database';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { SearchDoctorsDto } from './dto/search-doctors.dto';
import { CreateClinicDto } from './dto/create-clinic.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor) private doctorRepo: Repository<Doctor>,
    @InjectRepository(Clinic) private clinicRepo: Repository<Clinic>,
  ) {}

  async search(dto: SearchDoctorsDto) {
    const query = this.doctorRepo
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.user', 'user')
      .leftJoinAndSelect('doctor.clinic', 'clinic')
      .where('doctor.status = :status', { status: DoctorStatus.APPROVED });

    if (dto.specialization) {
      query.andWhere('LOWER(doctor.specialization) LIKE LOWER(:spec)', {
        spec: `%${dto.specialization}%`,
      });
    }
    if (dto.city) {
      query.andWhere('LOWER(doctor.city) LIKE LOWER(:city)', {
        city: `%${dto.city}%`,
      });
    }
    if (dto.name) {
      query.andWhere(
        "(LOWER(user.firstName) || ' ' || LOWER(user.lastName)) LIKE LOWER(:name)",
        { name: `%${dto.name}%` },
      );
    }
    if (dto.minFee !== undefined) {
      query.andWhere('doctor.consultationFee >= :minFee', { minFee: dto.minFee });
    }
    if (dto.maxFee !== undefined) {
      query.andWhere('doctor.consultationFee <= :maxFee', { maxFee: dto.maxFee });
    }

    query.orderBy('doctor.isFeatured', 'DESC');
    query.addOrderBy('doctor.averageRating', 'DESC');

    const page = dto.page || 1;
    const limit = dto.limit || 10;
    query.skip((page - 1) * limit).take(limit);

    const [doctors, total] = await query.getManyAndCount();
    return {
      data: doctors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const doctor = await this.doctorRepo.findOne({
      where: { id },
      relations: ['user', 'clinic', 'availabilities', 'reviews'],
    });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  async getMyProfile(userId: string) {
    const doctor = await this.doctorRepo.findOne({
      where: { userId },
      relations: ['user', 'clinic', 'availabilities'],
    });
    if (!doctor) throw new NotFoundException('Doctor profile not found');
    return doctor;
  }

  async createProfile(userId: string, dto: CreateDoctorProfileDto) {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    Object.assign(doctor, dto);
    return this.doctorRepo.save(doctor);
  }

  async updateProfile(userId: string, dto: UpdateDoctorProfileDto) {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    Object.assign(doctor, dto);
    return this.doctorRepo.save(doctor);
  }

  async createClinic(userId: string, dto: CreateClinicDto) {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    let clinic = await this.clinicRepo.findOne({ where: { doctorId: doctor.id } });
    if (clinic) {
      Object.assign(clinic, dto);
    } else {
      clinic = this.clinicRepo.create({ ...dto, doctorId: doctor.id });
    }
    return this.clinicRepo.save(clinic);
  }

  async getSpecializations(): Promise<string[]> {
    const result = await this.doctorRepo
      .createQueryBuilder('doctor')
      .select('DISTINCT doctor.specialization', 'specialization')
      .where('doctor.status = :status', { status: DoctorStatus.APPROVED })
      .getRawMany();
    return result.map((r) => r.specialization);
  }

  async getCities(): Promise<string[]> {
    const result = await this.doctorRepo
      .createQueryBuilder('doctor')
      .select('DISTINCT doctor.city', 'city')
      .where('doctor.status = :status', { status: DoctorStatus.APPROVED })
      .andWhere('doctor.city IS NOT NULL')
      .getRawMany();
    return result.map((r) => r.city).filter(Boolean);
  }

  async findByUserId(userId: string): Promise<Doctor> {
    return this.doctorRepo.findOne({ where: { userId } });
  }
}
