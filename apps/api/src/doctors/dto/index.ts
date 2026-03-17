import { IsString, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDoctorProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() specialization?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subSpecialization?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) experienceYears?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() qualification?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() registrationNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bio?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) consultationFee?: number;
  @ApiPropertyOptional() @IsOptional() @IsArray() languages?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() services?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() profileImage?: string;
}

export class UpdateDoctorProfileDto extends CreateDoctorProfileDto {}

export class SearchDoctorsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() specialization?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) minFee?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) maxFee?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) @Type(() => Number) page?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) @Max(50) @Type(() => Number) limit?: number;
}

export class CreateClinicDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsString() addressLine1: string;
  @IsOptional() @IsString() addressLine2?: string;
  @IsString() city: string;
  @IsString() state: string;
  @IsString() pincode: string;
  @IsOptional() @IsString() landmark?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsArray() photos?: string[];
  @IsOptional() @IsArray() amenities?: string[];
}
