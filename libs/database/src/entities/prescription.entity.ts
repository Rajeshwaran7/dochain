import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';
import { Appointment } from './appointment.entity';

export type PrescriptionMedicine = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
};

export type PrescriptionPayload = {
  medicines: PrescriptionMedicine[];
  instructions?: string;
  issuedAt: string;
};

@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  @JoinColumn()
  doctor: Doctor;

  @Column()
  doctorId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn()
  patient: Patient;

  @Column()
  patientId: string;

  @ManyToOne(() => Appointment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  appointment: Appointment;

  @Column({ nullable: true })
  appointmentId: string;

  @Column({ type: 'text', nullable: true })
  pdfUrl: string;

  @Column({ nullable: true })
  pdfPublicId: string;

  @Column({ type: 'jsonb' })
  payload: PrescriptionPayload;

  @Column({ type: 'timestamptz', nullable: true })
  voidedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
