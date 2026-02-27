import { Module } from '@nestjs/common';

// Persistence
import { PrismaModule } from '../persistence/prisma/prisma.module';
import {
  REVIEW_REPOSITORY,
  REVIEW_SETTINGS_REPOSITORY,
  TOPIC_REPOSITORY,
  SESSION_REPOSITORY,
} from '../persistence/injection-tokens';

// Repository implementations
import {
  ReviewPrismaRepository,
  ReviewSettingsPrismaRepository,
  TopicPrismaRepository,
  SessionPrismaRepository,
} from '../persistence/repositories';

// Controller
import { ReviewsController } from '../http/controllers';

// Use-case tokens
import { USE_CASE_TOKENS } from '../http/use-case-tokens';

// Use-cases
import {
  GetPendingReviewsUseCase,
  GetUpcomingReviewsUseCase,
  CompleteReviewUseCase,
  SkipReviewUseCase,
  RecalculateUrgencyUseCase,
} from '../../application/use-cases/reviews';

// Application ports (types only)
import type { ReviewRepositoryPort } from '../../application/ports/review-repository.port';
import type { ReviewSettingsRepositoryPort } from '../../application/ports/review-settings-repository.port';
import type { TopicRepositoryPort } from '../../application/ports/topic-repository.port';
import type { SessionRepositoryPort } from '../../application/ports/session-repository.port';

@Module({
  imports: [PrismaModule],
  controllers: [ReviewsController],
  providers: [
    // ── Repository bindings ──────────────────────────
    { provide: REVIEW_REPOSITORY, useClass: ReviewPrismaRepository },
    { provide: REVIEW_SETTINGS_REPOSITORY, useClass: ReviewSettingsPrismaRepository },
    { provide: TOPIC_REPOSITORY, useClass: TopicPrismaRepository },
    { provide: SESSION_REPOSITORY, useClass: SessionPrismaRepository },

    // ── Use-case factories ───────────────────────────
    {
      provide: USE_CASE_TOKENS.GetPendingReviewsUseCase,
      useFactory: (reviewRepo: ReviewRepositoryPort) =>
        new GetPendingReviewsUseCase(reviewRepo),
      inject: [REVIEW_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.GetUpcomingReviewsUseCase,
      useFactory: (reviewRepo: ReviewRepositoryPort) =>
        new GetUpcomingReviewsUseCase(reviewRepo),
      inject: [REVIEW_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.CompleteReviewUseCase,
      useFactory: (
        reviewRepo: ReviewRepositoryPort,
        reviewSettingsRepo: ReviewSettingsRepositoryPort,
        topicRepo: TopicRepositoryPort,
        sessionRepo: SessionRepositoryPort,
      ) => new CompleteReviewUseCase(reviewRepo, reviewSettingsRepo, topicRepo, sessionRepo),
      inject: [REVIEW_REPOSITORY, REVIEW_SETTINGS_REPOSITORY, TOPIC_REPOSITORY, SESSION_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.SkipReviewUseCase,
      useFactory: (reviewRepo: ReviewRepositoryPort) =>
        new SkipReviewUseCase(reviewRepo),
      inject: [REVIEW_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.RecalculateUrgencyUseCase,
      useFactory: (reviewRepo: ReviewRepositoryPort) =>
        new RecalculateUrgencyUseCase(reviewRepo),
      inject: [REVIEW_REPOSITORY],
    },
  ],
})
export class ReviewsModule {}
