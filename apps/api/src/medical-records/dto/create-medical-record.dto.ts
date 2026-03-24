import { IsString, IsOptional, IsUUID, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class DiagnosisDto {
  @IsOptional() @IsString() code?: string;
  @IsString() label: string;
}

export class CreateMedicalRecordDto {
  @IsUUID() patientId: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID() appointmentId?: string;

  @IsOptional() @IsDateString() visitAt?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() doctorNotes?: string;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => DiagnosisDto) diagnoses?: DiagnosisDto[];
}
