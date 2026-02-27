import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { USE_CASE_TOKENS } from '../use-case-tokens';
import { CreateTopicUseCase } from '../../../application/use-cases/topics';
import { GetTopicsUseCase } from '../../../application/use-cases/topics';
import { GetTopicUseCase } from '../../../application/use-cases/topics';
import { UpdateTopicUseCase } from '../../../application/use-cases/topics';
import { DeleteTopicUseCase } from '../../../application/use-cases/topics';
import { JwtAuthGuard, CurrentUser } from '../../auth';
import { CreateTopicDto, UpdateTopicDto } from '../dto/topics';
import { TopicWithFullDetails } from '../../../application/ports/topic-repository.port';
import { Topic } from '../../../domain/study';

@ApiTags('Topics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('studies/topics')
export class TopicsController {
  constructor(
    @Inject(USE_CASE_TOKENS.CreateTopicUseCase)
    private readonly createTopicUseCase: CreateTopicUseCase,
    @Inject(USE_CASE_TOKENS.GetTopicsUseCase)
    private readonly getTopicsUseCase: GetTopicsUseCase,
    @Inject(USE_CASE_TOKENS.GetTopicUseCase)
    private readonly getTopicUseCase: GetTopicUseCase,
    @Inject(USE_CASE_TOKENS.UpdateTopicUseCase)
    private readonly updateTopicUseCase: UpdateTopicUseCase,
    @Inject(USE_CASE_TOKENS.DeleteTopicUseCase)
    private readonly deleteTopicUseCase: DeleteTopicUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar temas de una asignatura' })
  async findBySubject(
    @Query('subjectId') subjectId: string,
    @CurrentUser('sub') userId: string,
  ) {
    const topics = await this.getTopicsUseCase.execute(subjectId, userId);
    // Map domain entities to flat Prisma-style records
    return topics.map((t) => this.mapTopicFlat(t));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener tema con sesiones y repasos' })
  async findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    const result = await this.getTopicUseCase.execute(id, userId);
    // Map to old Prisma-style: flat topic with subject (incl studyPlan), studySessions, reviewSchedules
    return this.mapTopicWithDetails(result);
  }

  @Post()
  @ApiOperation({ summary: 'Crear tema' })
  async create(@CurrentUser('sub') userId: string, @Body() dto: CreateTopicDto) {
    const topic = await this.createTopicUseCase.execute(userId, {
      subjectId: dto.subjectId,
      name: dto.name,
      description: dto.description,
    });
    return this.mapTopicFlat(topic);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar tema (incluye nivel de dominio manual)' })
  async update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateTopicDto,
  ) {
    const topic = await this.updateTopicUseCase.execute(id, userId, {
      name: dto.name,
      description: dto.description,
      masteryLevel: dto.masteryLevel,
      displayOrder: dto.displayOrder,
    });
    return this.mapTopicFlat(topic);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar tema' })
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    const topic = await this.deleteTopicUseCase.execute(id, userId);
    return this.mapTopicFlat(topic);
  }

  // ─── Presentation mapping helpers ─────────────────────

  /** Maps a Topic domain entity to a flat Prisma-style record */
  private mapTopicFlat(topic: Topic) {
    return topic.toJSON();
  }

  /** Maps findOne result: flat topic with nested subject, studySessions, reviewSchedules */
  private mapTopicWithDetails(result: TopicWithFullDetails) {
    return {
      ...result.topic.toJSON(),
      subject: {
        id: result.subject.id,
        studyPlanId: result.subject.studyPlanId,
        name: result.subject.name,
        description: result.subject.description,
        color: result.subject.color,
        displayOrder: result.subject.displayOrder,
        createdAt: result.subject.createdAt,
        updatedAt: result.subject.updatedAt,
        studyPlan: result.subject.studyPlan,
      },
      studySessions: result.studySessions,
      reviewSchedules: result.reviewSchedules,
    };
  }
}
