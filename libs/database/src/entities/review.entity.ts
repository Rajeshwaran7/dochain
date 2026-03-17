import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';
import { Appointment } from './appointment.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.reviews, { onDelete: 'CASCADE' })
  @JoinColumn()
  doctor: Doctor;

  @Column()
  doctorId: string;

  @ManyToOne(() => Patient, (patient) => patient.reviews)
  @JoinColumn()
  patient: Patient;

  @Column()
  patientId: string;

  @OneToOne(() => Appointment)
  @JoinColumn()
  appointment: Appointment;

  @Column()
  appointmentId: string;

  @Column({ type: 'int' })
  rating: number; // 1-5

  @Column({ nullable: true, type: 'text' })
  comment: string;

  @Column({ type: 'int', default: 0 })
  helpfulCount: number;

  @Column({ default: true })
  isVisible: boolean;

  @Column({ nullable: true })
  doctorReply: string;

  @Column({ nullable: true })
  doctorRepliedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
