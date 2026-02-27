import { Controller, Get, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { USE_CASE_TOKENS } from '../use-case-tokens';
import { GetDashboardUseCase } from '../../../application/use-cases/dashboard';
import { JwtAuthGuard, CurrentUser } from '../../auth';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    @Inject(USE_CASE_TOKENS.GetDashboardUseCase)
    private readonly getDashboardUseCase: GetDashboardUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener panel "Hoy"',
    description:
      'Devuelve repasos pendientes, sesiones del día, stats de la semana y actividad reciente.',
  })
  getDashboard(@CurrentUser('sub') userId: string) {
    return this.getDashboardUseCase.execute(userId);
  }
}
