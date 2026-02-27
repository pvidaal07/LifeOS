import { Module } from '@nestjs/common';

// Persistence
import { PrismaModule } from '../persistence/prisma/prisma.module';
import {
  SESSION_REPOSITORY,
  TOPIC_REPOSITORY,
  REVIEW_REPOSITORY,
  REVIEW_SETTINGS_REPOSITORY,
} from '../persistence/injection-tokens';

// Repository implementations
import {
  SessionPrismaRepository,
  TopicPrismaRepository,
  ReviewPrismaRepository,
  ReviewSettingsPrismaRepository,
} from '../persistence/repositories';

// Controller
import { SessionsController } from '../http/controllers';

// Use-case tokens
import { USE_CASE_TOKENS } from '../http/use-case-tokens';

// Use-cases
import {
  CreateSessionUseCase,
  GetTopicSessionsUseCase,
  GetRecentSessionsUseCase,
} from '../../application/use-cases/sessions';

// Application ports (types only)
import type { SessionRepositoryPort } from '../../application/ports/session-repository.port';
import type { TopicRepositoryPort } from '../../application/ports/topic-repository.port';
import type { ReviewRepositoryPort } from '../../application/ports/review-repository.port';
import type { ReviewSettingsRepositoryPort } from '../../application/ports/review-settings-repository.port';

@Module({
  imports: [PrismaModule],
  controllers: [SessionsController],
  providers: [
    // ── Repository bindings ──────────────────────────
    { provide: SESSION_REPOSITORY, useClass: SessionPrismaRepository },
    { provide: TOPIC_REPOSITORY, useClass: TopicPrismaRepository },
    { provide: REVIEW_REPOSITORY, useClass: ReviewPrismaRepository },
    { provide: REVIEW_SETTINGS_REPOSITORY, useClass: ReviewSettingsPrismaRepository },

    // ── Use-case factories ───────────────────────────
    {
      provide: USE_CASE_TOKENS.CreateSessionUseCase,
      useFactory: (
        sessionRepo: SessionRepositoryPort,
        topicRepo: TopicRepositoryPort,
        reviewRepo: ReviewRepositoryPort,
        reviewSettingsRepo: ReviewSettingsRepositoryPort,
      ) => new CreateSessionUseCase(sessionRepo, topicRepo, reviewRepo, reviewSettingsRepo),
      inject: [SESSION_REPOSITORY, TOPIC_REPOSITORY, REVIEW_REPOSITORY, REVIEW_SETTINGS_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.GetTopicSessionsUseCase,
      useFactory: (sessionRepo: SessionRepositoryPort) =>
        new GetTopicSessionsUseCase(sessionRepo),
      inject: [SESSION_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.GetRecentSessionsUseCase,
      useFactory: (sessionRepo: SessionRepositoryPort) =>
        new GetRecentSessionsUseCase(sessionRepo),
      inject: [SESSION_REPOSITORY],
    },
  ],
})
export class SessionsModule {}
