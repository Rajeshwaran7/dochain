import { Request } from 'express';
import {
  Controller, Get, Post, Body, Headers, RawBodyRequest,
  UseGuards, Request as NestRequest, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, SubscriptionPlan } from '@dochain/database';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all subscription plans and prices' })
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my current subscription' })
  async getMySubscription(@NestRequest() req: { user: { id: string } }) {
    return this.subscriptionsService.getMySubscription(req.user.id);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new subscription' })
  async createSubscription(
    @NestRequest() req: { user: { id: string } },
    @Body('plan') plan: SubscriptionPlan,
  ) {
    return this.subscriptionsService.createSubscription(req.user.id, plan);
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel current subscription' })
  async cancelSubscription(
    @NestRequest() req: { user: { id: string } },
    @Body('reason') reason?: string,
  ) {
    return this.subscriptionsService.cancelSubscription(req.user.id, reason);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Razorpay webhook handler' })
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    const rawStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
    const payload = (req.body ?? JSON.parse(rawStr)) as Record<string, unknown>;
    return this.subscriptionsService.handleWebhook(rawBody, payload, signature);
  }
}
