import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';

@Entity('clinics')
export class Clinic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Doctor, (doctor) => doctor.clinic, { onDelete: 'CASCADE' })
  @JoinColumn()
  doctor: Doctor;

  @Column()
  doctorId: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column()
  addressLine1: string;

  @Column({ nullable: true })
  addressLine2: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  pincode: string;

  @Column({ nullable: true })
  landmark: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Column({ nullable: true, type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  website: string;

  @Column({ type: 'simple-array', nullable: true })
  photos: string[];

  @Column({ type: 'simple-json', nullable: true })
  amenities: string[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
