import { IsString, IsDateString, IsEnum, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus, AppointmentType } from '@dochain/database';

export class CreateAppointmentDto {
  @ApiProperty() @IsUUID() doctorId: string;
  @ApiProperty() @IsDateString() appointmentDate: string;
  @ApiProperty() @IsString() startTime: string;
  @ApiProperty() @IsString() endTime: string;
  @ApiPropertyOptional({ enum: AppointmentType }) @IsOptional() @IsEnum(AppointmentType) type?: AppointmentType;
  @ApiPropertyOptional() @IsOptional() @IsString() symptoms?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  /** Same key on retry returns the same booking (patient must match). */
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(128) idempotencyKey?: string;
}

export class RescheduleAppointmentDto {
  @ApiProperty() @IsDateString() appointmentDate: string;
  @ApiProperty() @IsString() startTime: string;
  @ApiProperty() @IsString() endTime: string;
}

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: AppointmentStatus }) @IsEnum(AppointmentStatus) status: AppointmentStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cancellationReason?: string;
}
