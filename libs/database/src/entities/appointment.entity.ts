import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled',
}

export enum AppointmentType {
  IN_PERSON = 'in_person',
  VIDEO = 'video',
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.appointments, { eager: true })
  @JoinColumn()
  doctor: Doctor;

  @Column()
  doctorId: string;

  @ManyToOne(() => Patient, (patient) => patient.appointments, { eager: true })
  @JoinColumn()
  patient: Patient;

  @Column()
  patientId: string;

  @Column({ type: 'date' })
  appointmentDate: Date;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.PENDING })
  status: AppointmentStatus;

  @Column({ type: 'enum', enum: AppointmentType, default: AppointmentType.IN_PERSON })
  type: AppointmentType;

  @Column({ nullable: true, type: 'text' })
  symptoms: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ nullable: true, type: 'text' })
  doctorNotes: string;

  @Column({ nullable: true, type: 'text' })
  prescription: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fee: number;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ nullable: true })
  paymentId: string;

  @Column({ nullable: true })
  cancellationReason: string;

  @Column({ nullable: true })
  reminderSentAt: Date;

  @Column({ nullable: true })
  confirmationToken: string;

  /** Client-supplied key so retries do not create duplicate bookings. */
  @Column({ nullable: true, unique: true })
  idempotencyKey: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
