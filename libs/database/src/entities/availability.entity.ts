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

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

@Entity('availability')
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.availabilities, { onDelete: 'CASCADE' })
  @JoinColumn()
  doctor: Doctor;

  @Column()
  doctorId: string;

  @Column({ type: 'enum', enum: DayOfWeek })
  dayOfWeek: DayOfWeek;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'int', default: 15 })
  slotDurationMinutes: number;

  @Column({ type: 'int', default: 10 })
  maxAppointments: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  breakStartTime: string;

  @Column({ nullable: true })
  breakEndTime: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('availability_exceptions')
export class AvailabilityException {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  @JoinColumn()
  doctor: Doctor;

  @Column()
  doctorId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ default: false })
  isHoliday: boolean;

  @Column({ nullable: true })
  reason: string;

  @Column({ nullable: true })
  customStartTime: string;

  @Column({ nullable: true })
  customEndTime: string;

  @CreateDateColumn()
  createdAt: Date;
}
