import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { User, Doctor, Patient, Appointment, Subscription } from '@dochain/database';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Doctor, Patient, Appointment, Subscription]),
    SubscriptionsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
