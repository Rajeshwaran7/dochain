import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability, AvailabilityException, Doctor } from '@dochain/database';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAvailabilityDto {
  @IsString()
  dayOfWeek: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  slotDurationMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxAppointments?: number;

  @IsOptional()
  @IsString()
  breakStartTime?: string;

  @IsOptional()
  @IsString()
  breakEndTime?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateExceptionDto {
  @IsString()
  date: string;

  @IsOptional()
  @IsBoolean()
  isHoliday?: boolean;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  customStartTime?: string;

  @IsOptional()
  @IsString()
  customEndTime?: string;
}

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private availRepo: Repository<Availability>,
    @InjectRepository(AvailabilityException)
    private exceptionRepo: Repository<AvailabilityException>,
    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
  ) {}

  async getDoctorAvailability(doctorId: string) {
    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');
    return this.availRepo.find({ where: { doctorId, isActive: true } });
  }

  async setAvailability(userId: string, slots: CreateAvailabilityDto[]) {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    // Remove existing and replace
    await this.availRepo.delete({ doctorId: doctor.id });

    const availabilities: Availability[] = slots.map((slot) =>
      this.availRepo.create({ ...slot, doctorId: doctor.id } as Partial<Availability>),
    );
    return this.availRepo.save(availabilities);
  }

  async addException(userId: string, dto: CreateExceptionDto) {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const exception = this.exceptionRepo.create({ ...dto, doctorId: doctor.id } as any);
    return this.exceptionRepo.save(exception);
  }

  async getExceptions(doctorId: string) {
    return this.exceptionRepo.find({ where: { doctorId } });
  }
}
