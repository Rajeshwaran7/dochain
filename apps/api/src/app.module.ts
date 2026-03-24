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
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { ChatModule } from './chat/chat.module';
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
  MedicalRecordEntry,
  MedicalAttachment,
  Prescription,
  Conversation,
  Message,
} from '@dochain/database';
import { postgresSslFromEnv } from './postgres-ssl';

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
          MedicalRecordEntry,
          MedicalAttachment,
          Prescription,
          Conversation,
          Message,
        ],
        synchronize: config.get('DB_SYNC', 'true') === 'true',
        logging: config.get('DB_LOGGING', 'false') === 'true',
        ssl: postgresSslFromEnv(),
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
    CloudinaryModule,
    MedicalRecordsModule,
    PrescriptionsModule,
    ChatModule,
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
