import {
  Controller, Get, Post, Body, Headers, RawBodyRequest,
  UseGuards, Request, Req,
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
  async getMySubscription(@Request() req) {
    return this.subscriptionsService.getMySubscription(req.user.id);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new subscription' })
  async createSubscription(
    @Request() req,
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
    @Request() req,
    @Body('reason') reason?: string,
  ) {
    return this.subscriptionsService.cancelSubscription(req.user.id, reason);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Razorpay webhook handler' })
  async webhook(
    @Body() payload: any,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    return this.subscriptionsService.handleWebhook(payload, signature);
  }
}
