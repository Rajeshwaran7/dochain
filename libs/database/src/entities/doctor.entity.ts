import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Clinic } from './clinic.entity';
import { Appointment } from './appointment.entity';
import { Availability } from './availability.entity';
import { Review } from './review.entity';
import { Subscription } from './subscription.entity';

export enum DoctorStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column()
  specialization: string;

  @Column({ nullable: true })
  subSpecialization: string;

  @Column({ type: 'int', default: 0 })
  experienceYears: number;

  @Column({ nullable: true })
  qualification: string;

  @Column({ nullable: true })
  registrationNumber: string;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  consultationFee: number;

  @Column({ type: 'simple-array', nullable: true })
  languages: string[];

  @Column({ type: 'simple-array', nullable: true })
  services: string[];

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  profileImage: string;

  /** Cloudinary `public_id` for deleting/replacing the profile image. */
  @Column({ nullable: true })
  profileImagePublicId: string;

  @Column({ type: 'enum', enum: DoctorStatus, default: DoctorStatus.PENDING })
  status: DoctorStatus;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  totalReviews: number;

  @Column({ type: 'int', default: 0 })
  totalAppointments: number;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ nullable: true })
  featuredUntil: Date;

  @OneToOne(() => Clinic, (clinic) => clinic.doctor, { cascade: true })
  clinic: Clinic;

  @OneToMany(() => Appointment, (appointment) => appointment.doctor)
  appointments: Appointment[];

  @OneToMany(() => Availability, (availability) => availability.doctor)
  availabilities: Availability[];

  @OneToMany(() => Review, (review) => review.doctor)
  reviews: Review[];

  @OneToMany(() => Subscription, (subscription) => subscription.doctor)
  subscriptions: Subscription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
