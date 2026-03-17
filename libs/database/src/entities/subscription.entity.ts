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

export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  FEATURED = 'featured',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING = 'pending',
}

export const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.FREE]: 0,
  [SubscriptionPlan.BASIC]: 499,
  [SubscriptionPlan.PRO]: 999,
  [SubscriptionPlan.FEATURED]: 1999,
};

export const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  [SubscriptionPlan.FREE]: [
    'Basic profile listing',
    'Up to 10 appointments/month',
    'Email support',
  ],
  [SubscriptionPlan.BASIC]: [
    'Enhanced profile',
    'Up to 50 appointments/month',
    'Patient management',
    'Email & chat support',
  ],
  [SubscriptionPlan.PRO]: [
    'Premium profile',
    'Unlimited appointments',
    'Analytics dashboard',
    'SMS reminders',
    'Priority support',
  ],
  [SubscriptionPlan.FEATURED]: [
    'Everything in Pro',
    'Featured listing',
    'Top search placement',
    'Dedicated account manager',
    'Custom branding',
  ],
};

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn()
  doctor: Doctor;

  @Column()
  doctorId: string;

  @Column({ type: 'enum', enum: SubscriptionPlan })
  plan: SubscriptionPlan;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.PENDING })
  status: SubscriptionStatus;

  @Column({ nullable: true })
  razorpaySubscriptionId: string;

  @Column({ nullable: true })
  razorpayPlanId: string;

  @Column({ nullable: true })
  razorpayCustomerId: string;

  @Column({ nullable: true })
  lastPaymentId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ nullable: true, type: 'timestamp' })
  currentPeriodStart: Date;

  @Column({ nullable: true, type: 'timestamp' })
  currentPeriodEnd: Date;

  @Column({ nullable: true, type: 'timestamp' })
  trialEndsAt: Date;

  @Column({ nullable: true, type: 'timestamp' })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancelReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
