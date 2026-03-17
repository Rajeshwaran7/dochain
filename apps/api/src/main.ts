import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: [
      configService.get('PATIENT_APP_URL', 'http://localhost:3001'),
      configService.get('DOCTOR_APP_URL', 'http://localhost:3002'),
      configService.get('ADMIN_APP_URL', 'http://localhost:3003'),
      'http://localhost:3000',
    ],
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
