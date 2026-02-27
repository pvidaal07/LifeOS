import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import configuration from '../config/configuration';
import { DomainExceptionFilter } from './http/filters/domain-exception.filter';
import { TransformInterceptor } from './http/interceptors/transform.interceptor';

import {
  AuthModule,
  UsersModule,
  PlansModule,
  SubjectsModule,
  TopicsModule,
  SessionsModule,
  ReviewsModule,
  DashboardModule,
} from './modules';

@Module({
  imports: [
    // ── Global configuration ─────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // ── Feature modules ──────────────────────────────
    AuthModule,
    UsersModule,
    PlansModule,
    SubjectsModule,
    TopicsModule,
    SessionsModule,
    ReviewsModule,
    DashboardModule,
  ],
  providers: [
    // ── Global exception filter ──────────────────────
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
    // ── Global response interceptor ──────────────────
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
