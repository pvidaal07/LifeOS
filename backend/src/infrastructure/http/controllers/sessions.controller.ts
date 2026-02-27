import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { USE_CASE_TOKENS } from '../use-case-tokens';
import { CreateSessionUseCase } from '../../../application/use-cases/sessions';
import { GetTopicSessionsUseCase } from '../../../application/use-cases/sessions';
import { GetRecentSessionsUseCase } from '../../../application/use-cases/sessions';
import { JwtAuthGuard, CurrentUser } from '../../auth';
import { CreateSessionDto } from '../dto/sessions';

@ApiTags('Study Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('studies/sessions')
export class SessionsController {
  constructor(
    @Inject(USE_CASE_TOKENS.CreateSessionUseCase)
    private readonly createSessionUseCase: CreateSessionUseCase,
    @Inject(USE_CASE_TOKENS.GetTopicSessionsUseCase)
    private readonly getTopicSessionsUseCase: GetTopicSessionsUseCase,
    @Inject(USE_CASE_TOKENS.GetRecentSessionsUseCase)
    private readonly getRecentSessionsUseCase: GetRecentSessionsUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar sesión de estudio',
    description:
      'Si es la primera vez que se estudia el tema, programa automáticamente el primer repaso.',
  })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateSessionDto) {
    return this.createSessionUseCase.execute(userId, {
      topicId: dto.topicId,
      sessionType: dto.sessionType,
      durationMinutes: dto.durationMinutes,
      qualityRating: dto.qualityRating,
      notes: dto.notes,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Obtener sesiones de un tema' })
  findByTopic(
    @Query('topicId') topicId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.getTopicSessionsUseCase.execute(topicId, userId);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Obtener sesiones recientes' })
  findRecent(
    @CurrentUser('sub') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.getRecentSessionsUseCase.execute(userId, limit || 10);
  }
}
