import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { Prescription, Doctor, Patient, Appointment, Clinic } from '@dochain/database';

@Module({
  imports: [TypeOrmModule.forFeature([Prescription, Doctor, Patient, Appointment, Clinic])],
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}
