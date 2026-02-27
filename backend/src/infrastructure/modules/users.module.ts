import { Module } from '@nestjs/common';

// Persistence
import { PrismaModule } from '../persistence/prisma/prisma.module';
import {
  USER_REPOSITORY,
  USER_SETTINGS_REPOSITORY,
  USER_MODULE_REPOSITORY,
} from '../persistence/injection-tokens';

// Repository implementations
import {
  UserPrismaRepository,
  UserSettingsPrismaRepository,
  UserModulePrismaRepository,
} from '../persistence/repositories';

// Controller
import { UsersController } from '../http/controllers';

// Use-case tokens
import { USE_CASE_TOKENS } from '../http/use-case-tokens';

// Use-cases
import {
  GetProfileUseCase,
  UpdateProfileUseCase,
  UpdateSettingsUseCase,
  UpdateModulesUseCase,
  GetActiveModulesUseCase,
} from '../../application/use-cases/users';

// Application ports (types only)
import type {
  UserRepositoryPort,
  UserSettingsRepositoryPort,
  UserModuleRepositoryPort,
} from '../../application/ports/user-repository.port';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [
    // ── Repository bindings ──────────────────────────
    { provide: USER_REPOSITORY, useClass: UserPrismaRepository },
    { provide: USER_SETTINGS_REPOSITORY, useClass: UserSettingsPrismaRepository },
    { provide: USER_MODULE_REPOSITORY, useClass: UserModulePrismaRepository },

    // ── Use-case factories ───────────────────────────
    {
      provide: USE_CASE_TOKENS.GetProfileUseCase,
      useFactory: (userRepo: UserRepositoryPort) =>
        new GetProfileUseCase(userRepo),
      inject: [USER_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.UpdateProfileUseCase,
      useFactory: (userRepo: UserRepositoryPort) =>
        new UpdateProfileUseCase(userRepo),
      inject: [USER_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.UpdateSettingsUseCase,
      useFactory: (settingsRepo: UserSettingsRepositoryPort) =>
        new UpdateSettingsUseCase(settingsRepo),
      inject: [USER_SETTINGS_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.UpdateModulesUseCase,
      useFactory: (moduleRepo: UserModuleRepositoryPort) =>
        new UpdateModulesUseCase(moduleRepo),
      inject: [USER_MODULE_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.GetActiveModulesUseCase,
      useFactory: (moduleRepo: UserModuleRepositoryPort) =>
        new GetActiveModulesUseCase(moduleRepo),
      inject: [USER_MODULE_REPOSITORY],
    },
  ],
})
export class UsersModule {}
