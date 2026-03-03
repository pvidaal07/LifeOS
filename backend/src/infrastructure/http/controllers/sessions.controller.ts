import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Inject,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { USE_CASE_TOKENS } from '../use-case-tokens';
import { CreateSessionUseCase } from '../../../application/use-cases/sessions';
import { EditHistoricalSessionUseCase } from '../../../application/use-cases/sessions';
import { GetTopicSessionsUseCase } from '../../../application/use-cases/sessions';
import { GetRecentSessionsUseCase } from '../../../application/use-cases/sessions';
import { JwtAuthGuard, CurrentUser } from '../../auth';
import { CreateSessionDto, EditHistoricalSessionDto } from '../dto/sessions';
import { StudySessionWithDetails } from '../../../application/ports/session-repository.port';

@ApiTags('Study Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('studies/sessions')
export class SessionsController {
  constructor(
    @Inject(USE_CASE_TOKENS.CreateSessionUseCase)
    private readonly createSessionUseCase: CreateSessionUseCase,
    @Inject(USE_CASE_TOKENS.EditHistoricalSessionUseCase)
    private readonly editHistoricalSessionUseCase: EditHistoricalSessionUseCase,
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
  async create(@CurrentUser('sub') userId: string, @Body() dto: CreateSessionDto) {
    const result = await this.createSessionUseCase.execute(userId, {
      topicId: dto.topicId,
      sessionType: dto.sessionType,
      durationMinutes: dto.durationMinutes,
      qualityRating: dto.qualityRating,
      notes: dto.notes,
    });
    return this.mapSessionWithTopic(result);
  }

  @Patch(':id/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Editar historial de una sesion y recomputar repasos derivados' })
  async editHistory(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: EditHistoricalSessionDto,
  ) {
    const result = await this.editHistoricalSessionUseCase.execute({
      sessionId: id,
      userId,
      studiedAt: dto.studiedAt ? new Date(dto.studiedAt) : undefined,
      durationMinutes: dto.durationMinutes,
      qualityRating: dto.qualityRating,
    });

    return {
      sessionId: result.sessionId,
      topicId: result.topicId,
      anchorReviewNumber: result.anchorReviewNumber,
      recomputedReviewCount: result.recomputedReviewCount,
      systemMastery: result.systemMastery,
      topicStatus: result.topicStatus,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Obtener sesiones de un tema' })
  async findByTopic(
    @Query('topicId') topicId: string,
    @CurrentUser('sub') userId: string,
  ) {
    const results = await this.getTopicSessionsUseCase.execute(topicId, userId);
    // Old API returned flat sessions without topic nesting for findByTopic
    return results.map((r) => this.mapSessionFlat(r));
  }

  @Get('recent')
  @ApiOperation({ summary: 'Obtener sesiones recientes' })
  async findRecent(
    @CurrentUser('sub') userId: string,
    @Query('limit') limit?: number,
  ) {
    const results = await this.getRecentSessionsUseCase.execute(userId, limit || 10);
    return results.map((r) => this.mapSessionWithTopic(r));
  }

  // ─── Presentation mapping helpers ─────────────────────

  /**
   * Maps a StudySessionWithDetails to the old Prisma-style shape
   * with nested topic: { name, subject: { name, color } }.
   */
  private mapSessionWithTopic(s: StudySessionWithDetails) {
    const session = s.session;
    return {
      id: session.id,
      topicId: session.topicId,
      sessionType: session.sessionType.value,
      durationMinutes: session.durationMinutes,
      qualityRating: session.qualityRating,
      notes: session.notes,
      studiedAt: session.studiedAt,
      createdAt: session.createdAt,
      topic: {
        name: s.topicName,
        subject: {
          name: s.subjectName,
          color: s.subjectColor,
        },
      },
    };
  }

  /**
   * Maps a StudySessionWithDetails to a flat session record
   * (no topic nesting — matches old findByTopic behavior).
   */
  private mapSessionFlat(s: StudySessionWithDetails) {
    const session = s.session;
    return {
      id: session.id,
      userId: session.userId,
      topicId: session.topicId,
      sessionType: session.sessionType.value,
      durationMinutes: session.durationMinutes,
      qualityRating: session.qualityRating,
      notes: session.notes,
      studiedAt: session.studiedAt,
      createdAt: session.createdAt,
    };
  }
}
