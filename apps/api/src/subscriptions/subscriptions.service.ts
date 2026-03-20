import {
  Injectable, NotFoundException, BadRequestException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  Subscription, SubscriptionPlan, SubscriptionStatus, PLAN_PRICES, PLAN_FEATURES, Doctor,
} from '@dochain/database';
import * as crypto from 'crypto';

// Razorpay plan IDs (create these in Razorpay dashboard and set in .env)
const RAZORPAY_PLAN_IDS: Record<string, string> = {
  [SubscriptionPlan.BASIC]: process.env.RAZORPAY_PLAN_BASIC || 'plan_basic',
  [SubscriptionPlan.PRO]: process.env.RAZORPAY_PLAN_PRO || 'plan_pro',
  [SubscriptionPlan.FEATURED]: process.env.RAZORPAY_PLAN_FEATURED || 'plan_featured',
};

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private razorpay: any;

  constructor(
    @InjectRepository(Subscription) private subRepo: Repository<Subscription>,
    @InjectRepository(Doctor) private doctorRepo: Repository<Doctor>,
    private configService: ConfigService,
  ) {
    const Razorpay = require('razorpay');
    this.razorpay = new Razorpay({
      key_id: this.configService.get('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get('RAZORPAY_KEY_SECRET'),
    });
  }

  async createSubscription(userId: string, plan: SubscriptionPlan) {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    if (plan === SubscriptionPlan.FREE) {
      // Free plan - direct activation
      const sub = this.subRepo.create({
        doctorId: doctor.id,
        plan,
        status: SubscriptionStatus.ACTIVE,
        amount: 0,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      });
      return this.subRepo.save(sub);
    }

    // Create Razorpay subscription
    const razorpayPlanId = RAZORPAY_PLAN_IDS[plan];
    let razorpaySubscription: { id: string };
    try {
      razorpaySubscription = await this.razorpay.subscriptions.create({
        plan_id: razorpayPlanId,
        customer_notify: 1,
        quantity: 1,
        total_count: 12,
        notes: {
          doctorId: doctor.id,
          plan,
        },
      });
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode;
      const code = (err as { error?: { code?: string } })?.error?.code;
      const desc = (err as { error?: { description?: string } })?.error?.description;
      if (statusCode === 401 || code === 'BAD_REQUEST_ERROR') {
        this.logger.warn('Razorpay authentication failed. Set valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
        throw new BadRequestException(
          'Payment provider authentication failed. Please configure valid Razorpay credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) in .env.',
        );
      }
      this.logger.error(`Razorpay error: ${desc ?? (err as Error).message}`);
      throw new BadRequestException(desc ?? (err as Error).message ?? 'Payment provider request failed.');
    }

    const sub = this.subRepo.create({
      doctorId: doctor.id,
      plan,
      status: SubscriptionStatus.PENDING,
      amount: PLAN_PRICES[plan],
      razorpaySubscriptionId: razorpaySubscription.id,
      razorpayPlanId,
    });
    await this.subRepo.save(sub);

    return {
      subscription: sub,
      razorpaySubscriptionId: razorpaySubscription.id,
      keyId: this.configService.get('RAZORPAY_KEY_ID'),
    };
  }

  /**
   * Handles Razorpay webhook. Signature must be verified using the raw body.
   * @param rawBody - Raw request body (Buffer or string) as received from Razorpay
   * @param payload - Parsed JSON payload for processing
   * @param signature - x-razorpay-signature header value
   */
  async handleWebhook(rawBody: Buffer | string, payload: Record<string, unknown>, signature: string) {
    const webhookSecret = this.configService.get('RAZORPAY_WEBHOOK_SECRET');
    const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret ?? '')
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = payload.event as string;
    const payloadData = payload.payload as { subscription?: { entity?: { id: string; current_start?: number; current_end?: number } }; payment?: { entity?: { id: string } } } | undefined;
    const entity = payloadData?.subscription?.entity;

    this.logger.log(`Razorpay webhook: ${event}`);

    if (!entity) return { received: true };

    const sub = await this.subRepo.findOne({
      where: { razorpaySubscriptionId: entity.id },
    });
    if (!sub) return { received: true };

    switch (event) {
      case 'subscription.activated':
        sub.status = SubscriptionStatus.ACTIVE;
        sub.currentPeriodStart = new Date(entity.current_start * 1000);
        sub.currentPeriodEnd = new Date(entity.current_end * 1000);
        break;
      case 'subscription.charged':
        sub.status = SubscriptionStatus.ACTIVE;
        sub.lastPaymentId = payloadData?.payment?.entity?.id;
        sub.currentPeriodEnd = new Date(entity.current_end * 1000);
        break;
      case 'subscription.cancelled':
        sub.status = SubscriptionStatus.CANCELLED;
        sub.cancelledAt = new Date();
        break;
      case 'subscription.expired':
        sub.status = SubscriptionStatus.EXPIRED;
        break;
    }

    await this.subRepo.save(sub);

    if (sub.plan === SubscriptionPlan.FEATURED && (sub.status === SubscriptionStatus.CANCELLED || sub.status === SubscriptionStatus.EXPIRED)) {
      await this.doctorRepo.update(sub.doctorId, { isFeatured: false, featuredUntil: null as unknown as Date });
    }
    if (sub.plan === SubscriptionPlan.FEATURED && sub.status === SubscriptionStatus.ACTIVE) {
      await this.doctorRepo.update(sub.doctorId, {
        isFeatured: true,
        featuredUntil: sub.currentPeriodEnd,
      });
    }

    return { received: true };
  }

  async getMySubscription(userId: string) {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    return this.subRepo.findOne({
      where: { doctorId: doctor.id, status: SubscriptionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }

  async cancelSubscription(userId: string, reason?: string) {
    const doctor = await this.doctorRepo.findOne({ where: { userId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const sub = await this.subRepo.findOne({
      where: { doctorId: doctor.id, status: SubscriptionStatus.ACTIVE },
    });
    if (!sub) throw new NotFoundException('No active subscription');

    if (sub.razorpaySubscriptionId) {
      try {
        await this.razorpay.subscriptions.cancel(sub.razorpaySubscriptionId);
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 401) {
          throw new BadRequestException(
            'Payment provider authentication failed. Please configure valid Razorpay credentials in .env.',
          );
        }
        throw new BadRequestException((err as { error?: { description?: string } })?.error?.description ?? (err as Error).message ?? 'Failed to cancel at payment provider.');
      }
    }

    sub.status = SubscriptionStatus.CANCELLED;
    sub.cancelledAt = new Date();
    sub.cancelReason = reason;
    return this.subRepo.save(sub);
  }

  /**
   * Cancel a subscription by ID (admin only). Cancels in Razorpay if linked.
   */
  async cancelSubscriptionById(subscriptionId: string, reason?: string) {
    const sub = await this.subRepo.findOne({ where: { id: subscriptionId } });
    if (!sub) throw new NotFoundException('Subscription not found');
    if (sub.status === SubscriptionStatus.CANCELLED) return sub;

    if (sub.razorpaySubscriptionId) {
      try {
        await this.razorpay.subscriptions.cancel(sub.razorpaySubscriptionId);
      } catch (err) {
        this.logger.warn(`Razorpay cancel failed for ${sub.razorpaySubscriptionId}: ${err}`);
      }
    }

    sub.status = SubscriptionStatus.CANCELLED;
    sub.cancelledAt = new Date();
    sub.cancelReason = reason ?? 'Cancelled by admin';
    return this.subRepo.save(sub);
  }

  /**
   * Update subscription status (admin only). Use for support overrides.
   */
  async updateSubscriptionStatus(subscriptionId: string, status: SubscriptionStatus) {
    const sub = await this.subRepo.findOne({ where: { id: subscriptionId } });
    if (!sub) throw new NotFoundException('Subscription not found');

    sub.status = status;
    if (status === SubscriptionStatus.CANCELLED) sub.cancelledAt = new Date();

    const saved = await this.subRepo.save(sub);

    if (sub.plan === SubscriptionPlan.FEATURED && status !== SubscriptionStatus.ACTIVE) {
      await this.doctorRepo.update(sub.doctorId, { isFeatured: false, featuredUntil: null as unknown as Date });
    }
    if (sub.plan === SubscriptionPlan.FEATURED && status === SubscriptionStatus.ACTIVE) {
      await this.doctorRepo.update(sub.doctorId, {
        isFeatured: true,
        featuredUntil: sub.currentPeriodEnd ?? undefined,
      });
    }
    return saved;
  }

  getPlans() {
    return Object.values(SubscriptionPlan).map((plan) => ({
      plan,
      price: PLAN_PRICES[plan],
      features: PLAN_FEATURES[plan],
    }));
  }
}
