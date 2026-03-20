import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

/** CORS `origin` must be scheme+host+port; app URLs may include a path (e.g. `/doctor`). */
function toOrigin(candidate: string): string {
  try {
    return new URL(candidate).origin;
  } catch {
    return candidate;
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
    rawBody: true, // Required for Razorpay webhook signature verification
  });

  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS: use `WEB_ORIGIN` when patient, doctor, and admin are on one hostname (path-based routing).
  const webOrigin = configService.get<string>('WEB_ORIGIN')?.trim();
  const corsOrigins = webOrigin
    ? [webOrigin]
    : [
        toOrigin(configService.get('PATIENT_APP_URL', 'http://localhost:3001')),
        toOrigin(configService.get('DOCTOR_APP_URL', 'http://localhost:3002/doctor')),
        toOrigin(configService.get('ADMIN_APP_URL', 'http://localhost:3003/admin')),
        'http://localhost:3000',
      ];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Dochain API')
      .setDescription('Dochain - Doctor Appointment Booking Platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Doctors', 'Doctor management')
      .addTag('Patients', 'Patient management')
      .addTag('Appointments', 'Appointment booking')
      .addTag('Availability', 'Doctor availability')
      .addTag('Reviews', 'Reviews and ratings')
      .addTag('Subscriptions', 'Subscription management')
      .addTag('Admin', 'Admin operations')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log(`Swagger docs available at: http://localhost:${configService.get('PORT', 4000)}/api/docs`);
  }

  const port = configService.get('PORT', 4000);
  await app.listen(port);
  logger.log(`🚀 Dochain API running on: http://localhost:${port}/api/v1`);
}

bootstrap();
