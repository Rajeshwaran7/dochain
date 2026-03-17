import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { Review, Doctor, Patient, Appointment } from '@dochain/database';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Doctor, Patient, Appointment])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
