import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** DTO for requesting a new verification email by email address (public, no auth). */
export class ResendVerificationDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}
