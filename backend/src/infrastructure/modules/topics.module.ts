import { Module } from '@nestjs/common';

// Persistence
import { PrismaModule } from '../persistence/prisma/prisma.module';
import { TOPIC_REPOSITORY } from '../persistence/injection-tokens';

// Repository implementations
import { TopicPrismaRepository } from '../persistence/repositories';

// Controller
import { TopicsController } from '../http/controllers';

// Use-case tokens
import { USE_CASE_TOKENS } from '../http/use-case-tokens';

// Use-cases
import {
  CreateTopicUseCase,
  GetTopicsUseCase,
  GetTopicUseCase,
  UpdateTopicUseCase,
  DeleteTopicUseCase,
} from '../../application/use-cases/topics';

// Application ports (types only)
import type { TopicRepositoryPort } from '../../application/ports/topic-repository.port';

@Module({
  imports: [PrismaModule],
  controllers: [TopicsController],
  providers: [
    // ── Repository bindings ──────────────────────────
    { provide: TOPIC_REPOSITORY, useClass: TopicPrismaRepository },

    // ── Use-case factories ───────────────────────────
    {
      provide: USE_CASE_TOKENS.CreateTopicUseCase,
      useFactory: (topicRepo: TopicRepositoryPort) =>
        new CreateTopicUseCase(topicRepo),
      inject: [TOPIC_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.GetTopicsUseCase,
      useFactory: (topicRepo: TopicRepositoryPort) =>
        new GetTopicsUseCase(topicRepo),
      inject: [TOPIC_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.GetTopicUseCase,
      useFactory: (topicRepo: TopicRepositoryPort) =>
        new GetTopicUseCase(topicRepo),
      inject: [TOPIC_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.UpdateTopicUseCase,
      useFactory: (topicRepo: TopicRepositoryPort) =>
        new UpdateTopicUseCase(topicRepo),
      inject: [TOPIC_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.DeleteTopicUseCase,
      useFactory: (topicRepo: TopicRepositoryPort) =>
        new DeleteTopicUseCase(topicRepo),
      inject: [TOPIC_REPOSITORY],
    },
  ],
})
export class TopicsModule {}
