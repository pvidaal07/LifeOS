import { Module } from '@nestjs/common';

// Persistence
import { PrismaModule } from '../persistence/prisma/prisma.module';
import { STUDY_PLAN_REPOSITORY } from '../persistence/injection-tokens';

// Repository implementations
import { StudyPlanPrismaRepository } from '../persistence/repositories';

// Controller
import { PlansController } from '../http/controllers';

// Use-case tokens
import { USE_CASE_TOKENS } from '../http/use-case-tokens';

// Use-cases
import {
  CreatePlanUseCase,
  GetPlansUseCase,
  GetPlanUseCase,
  UpdatePlanUseCase,
  DeletePlanUseCase,
} from '../../application/use-cases/plans';

// Application ports (types only)
import type { StudyPlanRepositoryPort } from '../../application/ports/study-plan-repository.port';

@Module({
  imports: [PrismaModule],
  controllers: [PlansController],
  providers: [
    // ── Repository bindings ──────────────────────────
    { provide: STUDY_PLAN_REPOSITORY, useClass: StudyPlanPrismaRepository },

    // ── Use-case factories ───────────────────────────
    {
      provide: USE_CASE_TOKENS.CreatePlanUseCase,
      useFactory: (planRepo: StudyPlanRepositoryPort) =>
        new CreatePlanUseCase(planRepo),
      inject: [STUDY_PLAN_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.GetPlansUseCase,
      useFactory: (planRepo: StudyPlanRepositoryPort) =>
        new GetPlansUseCase(planRepo),
      inject: [STUDY_PLAN_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.GetPlanUseCase,
      useFactory: (planRepo: StudyPlanRepositoryPort) =>
        new GetPlanUseCase(planRepo),
      inject: [STUDY_PLAN_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.UpdatePlanUseCase,
      useFactory: (planRepo: StudyPlanRepositoryPort) =>
        new UpdatePlanUseCase(planRepo),
      inject: [STUDY_PLAN_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.DeletePlanUseCase,
      useFactory: (planRepo: StudyPlanRepositoryPort) =>
        new DeletePlanUseCase(planRepo),
      inject: [STUDY_PLAN_REPOSITORY],
    },
  ],
})
export class PlansModule {}
