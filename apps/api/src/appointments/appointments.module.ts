import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment, Doctor, Patient, Availability, AvailabilityException } from '@dochain/database';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Doctor, Patient, Availability, AvailabilityException])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
