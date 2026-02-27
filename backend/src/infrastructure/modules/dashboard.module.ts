import { Module } from '@nestjs/common';

// Persistence
import { PrismaModule } from '../persistence/prisma/prisma.module';
import { DASHBOARD_REPOSITORY } from '../persistence/injection-tokens';

// Repository implementations
import { DashboardPrismaRepository } from '../persistence/repositories';

// Controller
import { DashboardController } from '../http/controllers';

// Use-case tokens
import { USE_CASE_TOKENS } from '../http/use-case-tokens';

// Use-cases
import { GetDashboardUseCase } from '../../application/use-cases/dashboard';

// Application ports (types only)
import type { DashboardRepositoryPort } from '../../application/ports/dashboard-repository.port';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [
    // ── Repository bindings ──────────────────────────
    { provide: DASHBOARD_REPOSITORY, useClass: DashboardPrismaRepository },

    // ── Use-case factories ───────────────────────────
    {
      provide: USE_CASE_TOKENS.GetDashboardUseCase,
      useFactory: (dashboardRepo: DashboardRepositoryPort) =>
        new GetDashboardUseCase(dashboardRepo),
      inject: [DASHBOARD_REPOSITORY],
    },
  ],
})
export class DashboardModule {}
