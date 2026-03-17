import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';
import { DoctorsModule } from './doctors/doctors.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AvailabilityModule } from './availability/availability.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AdminModule } from './admin/admin.module';
import { MailModule } from './mail/mail.module';
import {
  User,
  Doctor,
  Patient,
  Clinic,
  Appointment,
  Availability,
  AvailabilityException,
  Review,
  Subscription,
} from '@dochain/database';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env.local'),
        join(process.cwd(), '.env'),
        join(process.cwd(), '..', '..', '.env.local'),
        join(process.cwd(), '..', '..', '.env'),
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'root'),
        database: config.get('DB_NAME', 'doc_db'),
        entities: [
          User,
          Doctor,
          Patient,
          Clinic,
          Appointment,
          Availability,
          AvailabilityException,
          Review,
          Subscription,
        ],
        synchronize: config.get('DB_SYNC', 'true') === 'true',
        logging: config.get('DB_LOGGING', 'false') === 'true',
        ssl: config.get('NODE_ENV') === 'production'
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    ScheduleModule.forRoot(),
    MailModule,
    AuthModule,
    DoctorsModule,
    PatientsModule,
    AppointmentsModule,
    AvailabilityModule,
    ReviewsModule,
    SubscriptionsModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
