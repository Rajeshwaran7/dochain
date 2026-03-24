import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum DoctorPatientsSortBy {
  NAME = 'name',
  LAST_VISIT = 'last_visit',
}

export enum DoctorPatientsOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class DoctorPatientsQueryDto {
  @ApiPropertyOptional({ description: 'Search by patient name, email, or phone' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: DoctorPatientsSortBy })
  @IsOptional()
  @IsEnum(DoctorPatientsSortBy)
  sortBy?: DoctorPatientsSortBy;

  @ApiPropertyOptional({ enum: DoctorPatientsOrder })
  @IsOptional()
  @IsEnum(DoctorPatientsOrder)
  order?: DoctorPatientsOrder;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
