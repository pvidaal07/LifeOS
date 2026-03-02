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
  EMAIL_VERIFICATION_SENDER,
  SYSTEM_CLOCK,
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
  EmailVerificationSenderService,
  SmtpEmailVerificationSenderService,
  SystemClockService,
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
  VerifyEmailUseCase,
  ResendVerificationCodeUseCase,
  RefreshTokensUseCase,
  IssueVerificationCodeService,
} from '../../application/use-cases/auth';
import { GetProfileUseCase } from '../../application/use-cases/users';

// Domain services
import { UserInitializationService } from '../../domain/user';

// Application ports (types only — for factory signatures)
import type { UserRepositoryPort, UserSettingsRepositoryPort, UserModuleRepositoryPort } from '../../application/ports/user-repository.port';
import type { PasswordHasherPort, AuthTokenPort } from '../../application/ports/auth.port';
import type { ClockPort } from '../../application/ports/clock.port';
import type {
  EmailVerificationSenderPort,
  EmailVerificationConfig,
} from '../../application/ports/email-verification.port';

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
    { provide: SYSTEM_CLOCK, useClass: SystemClockService },
    EmailVerificationSenderService,
    SmtpEmailVerificationSenderService,
    {
      provide: EMAIL_VERIFICATION_SENDER,
      useFactory: (
        config: ConfigService,
        logSender: EmailVerificationSenderService,
        smtpSender: SmtpEmailVerificationSenderService,
      ) => resolveEmailVerificationSender(config, logSender, smtpSender),
      inject: [
        ConfigService,
        EmailVerificationSenderService,
        SmtpEmailVerificationSenderService,
      ],
    },

    // ── Passport strategies ──────────────────────────
    JwtStrategy,
    JwtRefreshStrategy,

    // ── Use-case factories ───────────────────────────
    {
      provide: IssueVerificationCodeService,
      useFactory: (
        passwordHasher: PasswordHasherPort,
        verificationSender: EmailVerificationSenderPort,
        config: ConfigService,
        clock: ClockPort,
      ) =>
        new IssueVerificationCodeService(
          passwordHasher,
          verificationSender,
          getEmailVerificationConfig(config),
          clock,
        ),
      inject: [PASSWORD_HASHER, EMAIL_VERIFICATION_SENDER, ConfigService, SYSTEM_CLOCK],
    },
    {
      provide: USE_CASE_TOKENS.RegisterUseCase,
      useFactory: (
        userRepo: UserRepositoryPort,
        userSettingsRepo: UserSettingsRepositoryPort,
        userModuleRepo: UserModuleRepositoryPort,
        passwordHasher: PasswordHasherPort,
        issueVerificationCode: IssueVerificationCodeService,
      ) =>
        new RegisterUseCase(
          userRepo,
          userSettingsRepo,
          userModuleRepo,
          passwordHasher,
          new UserInitializationService(),
          issueVerificationCode,
        ),
      inject: [
        USER_REPOSITORY,
        USER_SETTINGS_REPOSITORY,
        USER_MODULE_REPOSITORY,
        PASSWORD_HASHER,
        IssueVerificationCodeService,
      ],
    },
    {
      provide: USE_CASE_TOKENS.LoginUseCase,
      useFactory: (
        userRepo: UserRepositoryPort,
        passwordHasher: PasswordHasherPort,
        authToken: AuthTokenPort,
        issueVerificationCode: IssueVerificationCodeService,
        config: ConfigService,
        clock: ClockPort,
      ) =>
        new LoginUseCase(
          userRepo,
          passwordHasher,
          authToken,
          issueVerificationCode,
          getEmailVerificationConfig(config),
          clock,
        ),
      inject: [
        USER_REPOSITORY,
        PASSWORD_HASHER,
        AUTH_TOKEN,
        IssueVerificationCodeService,
        ConfigService,
        SYSTEM_CLOCK,
      ],
    },
    {
      provide: USE_CASE_TOKENS.VerifyEmailUseCase,
      useFactory: (
        userRepo: UserRepositoryPort,
        passwordHasher: PasswordHasherPort,
        authToken: AuthTokenPort,
        config: ConfigService,
        clock: ClockPort,
      ) =>
        new VerifyEmailUseCase(
          userRepo,
          passwordHasher,
          authToken,
          getEmailVerificationConfig(config),
          clock,
        ),
      inject: [USER_REPOSITORY, PASSWORD_HASHER, AUTH_TOKEN, ConfigService, SYSTEM_CLOCK],
    },
    {
      provide: USE_CASE_TOKENS.ResendVerificationCodeUseCase,
      useFactory: (
        userRepo: UserRepositoryPort,
        issueVerificationCode: IssueVerificationCodeService,
      ) =>
        new ResendVerificationCodeUseCase(userRepo, issueVerificationCode),
      inject: [USER_REPOSITORY, IssueVerificationCodeService],
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

function getEmailVerificationConfig(config: ConfigService): EmailVerificationConfig {
  return {
    codeLength: config.get<number>('emailVerification.codeLength', 6),
    expiresInMinutes: config.get<number>('emailVerification.expiresInMinutes', 15),
    resendCooldownSeconds: config.get<number>('emailVerification.resendCooldownSeconds', 60),
    maxAttempts: config.get<number>('emailVerification.maxAttempts', 5),
  };
}

export function resolveEmailVerificationSender(
  config: ConfigService,
  logSender: EmailVerificationSenderPort,
  smtpSender: EmailVerificationSenderPort,
): EmailVerificationSenderPort {
  const transport = config.get<'smtp' | 'log'>('emailVerification.transport', 'log');
  return transport === 'smtp' ? smtpSender : logSender;
}
