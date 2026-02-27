import { Module } from '@nestjs/common';

// Persistence
import { PrismaModule } from '../persistence/prisma/prisma.module';
import { SUBJECT_REPOSITORY } from '../persistence/injection-tokens';

// Repository implementations
import { SubjectPrismaRepository } from '../persistence/repositories';

// Controller
import { SubjectsController } from '../http/controllers';

// Use-case tokens
import { USE_CASE_TOKENS } from '../http/use-case-tokens';

// Use-cases
import {
  CreateSubjectUseCase,
  GetSubjectsUseCase,
  GetSubjectUseCase,
  UpdateSubjectUseCase,
  DeleteSubjectUseCase,
} from '../../application/use-cases/subjects';

// Application ports (types only)
import type { SubjectRepositoryPort } from '../../application/ports/subject-repository.port';

@Module({
  imports: [PrismaModule],
  controllers: [SubjectsController],
  providers: [
    // ── Repository bindings ──────────────────────────
    { provide: SUBJECT_REPOSITORY, useClass: SubjectPrismaRepository },

    // ── Use-case factories ───────────────────────────
    {
      provide: USE_CASE_TOKENS.CreateSubjectUseCase,
      useFactory: (subjectRepo: SubjectRepositoryPort) =>
        new CreateSubjectUseCase(subjectRepo),
      inject: [SUBJECT_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.GetSubjectsUseCase,
      useFactory: (subjectRepo: SubjectRepositoryPort) =>
        new GetSubjectsUseCase(subjectRepo),
      inject: [SUBJECT_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.GetSubjectUseCase,
      useFactory: (subjectRepo: SubjectRepositoryPort) =>
        new GetSubjectUseCase(subjectRepo),
      inject: [SUBJECT_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.UpdateSubjectUseCase,
      useFactory: (subjectRepo: SubjectRepositoryPort) =>
        new UpdateSubjectUseCase(subjectRepo),
      inject: [SUBJECT_REPOSITORY],
    },
    {
      provide: USE_CASE_TOKENS.DeleteSubjectUseCase,
      useFactory: (subjectRepo: SubjectRepositoryPort) =>
        new DeleteSubjectUseCase(subjectRepo),
      inject: [SUBJECT_REPOSITORY],
    },
  ],
})
export class SubjectsModule {}
