import { IsString, IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
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
}

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: AppointmentStatus }) @IsEnum(AppointmentStatus) status: AppointmentStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() cancellationReason?: string;
}
