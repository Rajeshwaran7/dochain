import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Doctor } from './doctor.entity';
import { Patient } from './patient.entity';
import { Appointment } from './appointment.entity';
import { Message } from './message.entity';

/** One thread per doctor–patient pair; `appointmentId` optional scope (uniqueness enforced in app). */
@Entity('conversations')
@Index(['doctorId', 'patientId'])
export class Conversation {
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

  @OneToMany(() => Message, (m) => m.conversation)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
