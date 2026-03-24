import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PrescriptionMedicineDto {
  @IsString() name: string;
  @IsString() dosage: string;
  @IsString() frequency: string;
  @IsString() duration: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class CreatePrescriptionDto {
  @IsUUID() patientId: string;

  @ApiPropertyOptional() @IsOptional() @IsUUID() appointmentId?: string;

  @IsArray() @ValidateNested({ each: true }) @Type(() => PrescriptionMedicineDto)
  medicines: PrescriptionMedicineDto[];

  @ApiPropertyOptional() @IsOptional() @IsString() instructions?: string;
}
