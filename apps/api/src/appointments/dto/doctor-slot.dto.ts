import { ApiProperty } from '@nestjs/swagger';

export class DoctorSlotDto {
  @ApiProperty({ example: '09:00' })
  time!: string;

  @ApiProperty({ enum: ['available', 'booked', 'completed', 'past'] })
  status!: 'available' | 'booked' | 'completed' | 'past';
}
