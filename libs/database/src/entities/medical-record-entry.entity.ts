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

export type DiagnosisItem = { code?: string; label: string };

@Entity('medical_record_entries')
export class MedicalRecordEntry {
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

  @Column({ type: 'timestamptz' })
  visitAt: Date;

  @Column({ type: 'text', nullable: true })
  doctorNotes: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  diagnoses: DiagnosisItem[];

  @Column({ nullable: true })
  supersededById: string;

  @CreateDateColumn()
  createdAt: Date;
}
