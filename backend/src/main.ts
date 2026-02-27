import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // ─── Global prefix ───────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── CORS ─────────────────────────────────────────
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });

  // ─── Cookie parser (refresh tokens) ───────────────
  app.use(cookieParser());

  // ─── Global pipes ─────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── Global filters & interceptors ────────────────
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // ─── Swagger ──────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('LifeOS API')
    .setDescription('API para LifeOS - Sistema Operativo Personal')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('Auth', 'Autenticación y registro')
    .addTag('Users', 'Perfil y configuración')
    .addTag('Study Plans', 'Planes de estudio')
    .addTag('Subjects', 'Asignaturas')
    .addTag('Topics', 'Temas')
    .addTag('Study Sessions', 'Sesiones de estudio')
    .addTag('Reviews', 'Repasos programados')
    .addTag('Dashboard', 'Panel principal - Hoy')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // ─── Start ────────────────────────────────────────
  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 LifeOS API ejecutándose en http://localhost:${port}`);
  logger.log(`📚 Swagger docs en http://localhost:${port}/api/docs`);
}

bootstrap();
