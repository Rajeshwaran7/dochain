import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** Doctor opens thread with a patient; patient opens thread with a doctor. */
export class OpenConversationDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() patientId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() doctorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() appointmentId?: string;
}
