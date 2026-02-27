import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StudiesModule } from './modules/studies/studies.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Base de datos
    PrismaModule,

    // Módulos de la aplicación
    AuthModule,
    UsersModule,
    StudiesModule,
    DashboardModule,
  ],
})
export class AppModule {}
