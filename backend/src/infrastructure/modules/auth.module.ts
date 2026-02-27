import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';

// Persistence
import { PrismaModule } from '../persistence/prisma/prisma.module';
import {
  USER_REPOSITORY,
  USER_SETTINGS_REPOSITORY,
  USER_MODULE_REPOSITORY,
  REVIEW_SETTINGS_REPOSITORY,
  PASSWORD_HASHER,
  AUTH_TOKEN,
} from '../persistence/injection-tokens';

// Repository implementations
import {
  UserPrismaRepository,
  UserSettingsPrismaRepository,
  UserModulePrismaRepository,
  ReviewSettingsPrismaRepository,
} from '../persistence/repositories';

// Auth infrastructure
import {
  BcryptPasswordHasherService,
  JwtAuthTokenService,
  JwtStrategy,
  JwtRefreshStrategy,
} from '../auth';

// Controller
import { AuthController } from '../http/controllers';

// Use-case tokens
import { USE_CASE_TOKENS } from '../http/use-case-tokens';

// Use-cases
import {
  RegisterUseCase,
  LoginUseCase,
  RefreshTokensUseCase,
} from '../../application/use-cases/auth';
import { GetProfileUseCase } from '../../application/use-cases/users';

// Domain services
import { UserInitializationService } from '../../domain/user';

// Application ports (types only — for factory signatures)
import type { UserRepositoryPort, UserSettingsRepositoryPort, UserModuleRepositoryPort } from '../../application/ports/user-repository.port';
import type { PasswordHasherPort, AuthTokenPort } from '../../application/ports/auth.port';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: config.get<string>('jwt.expiration') as StringValue,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // ── Repository bindings ──────────────────────────
    { provide: USER_REPOSITORY, useClass: UserPrismaRepository },
    { provide: USER_SETTINGS_REPOSITORY, useClass: UserSettingsPrismaRepository },
    { provide: USER_MODULE_REPOSITORY, useClass: UserModulePrismaRepository },
    { provide: REVIEW_SETTINGS_REPOSITORY, useClass: ReviewSettingsPrismaRepository },

    // ── Auth adapter bindings ────────────────────────
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasherService },
    { provide: AUTH_TOKEN, useClass: JwtAuthTokenService },

    // ── Passport strategies ──────────────────────────
    JwtStrategy,
    JwtRefreshStrategy,

    // ── Use-case factories ───────────────────────────
    {
      provide: USE_CASE_TOKENS.RegisterUseCase,
      useFactory: (
        userRepo: UserRepositoryPort,
        userSettingsRepo: UserSettingsRepositoryPort,
        userModuleRepo: UserModuleRepositoryPort,
        passwordHasher: PasswordHasherPort,
        authToken: AuthTokenPort,
      ) =>
        new RegisterUseCase(
          userRepo,
          userSettingsRepo,
          userModuleRepo,
          passwordHasher,
          authToken,
          new UserInitializationService(),
        ),
      inject: [
        USER_REPOSITORY,
        USER_SETTINGS_REPOSITORY,
        USER_MODULE_REPOSITORY,
        PASSWORD_HASHER,
        AUTH_TOKEN,
      ],
    },
    {
      provide: USE_CASE_TOKENS.LoginUseCase,
      useFactory: (
        userRepo: UserRepositoryPort,
        passwordHasher: PasswordHasherPort,
        authToken: AuthTokenPort,
      ) => new LoginUseCase(userRepo, passwordHasher, authToken),
      inject: [USER_REPOSITORY, PASSWORD_HASHER, AUTH_TOKEN],
    },
    {
      provide: USE_CASE_TOKENS.RefreshTokensUseCase,
      useFactory: (userRepo: UserRepositoryPort, authToken: AuthTokenPort) =>
        new RefreshTokensUseCase(userRepo, authToken),
      inject: [USER_REPOSITORY, AUTH_TOKEN],
    },
    {
      provide: USE_CASE_TOKENS.GetProfileUseCase,
      useFactory: (userRepo: UserRepositoryPort) =>
        new GetProfileUseCase(userRepo),
      inject: [USER_REPOSITORY],
    },
  ],
  exports: [
    // Export auth tokens so other modules can use guards that depend on strategies
    USER_REPOSITORY,
    USER_SETTINGS_REPOSITORY,
    USER_MODULE_REPOSITORY,
    PASSWORD_HASHER,
    AUTH_TOKEN,
    JwtStrategy,
    JwtRefreshStrategy,
    PassportModule,
    JwtModule,
  ],
})
export class AuthModule {}
