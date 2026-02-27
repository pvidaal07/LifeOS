import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener panel "Hoy"',
    description: 'Devuelve repasos pendientes, sesiones del día, stats de la semana y actividad reciente.',
  })
  getDashboard(@CurrentUser('sub') userId: string) {
    return this.dashboardService.getDashboard(userId);
  }
}
