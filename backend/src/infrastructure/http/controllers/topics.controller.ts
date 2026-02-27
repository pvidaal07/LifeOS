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
  findBySubject(
    @Query('subjectId') subjectId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.getTopicsUseCase.execute(subjectId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener tema con sesiones y repasos' })
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.getTopicUseCase.execute(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear tema' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateTopicDto) {
    return this.createTopicUseCase.execute(userId, {
      subjectId: dto.subjectId,
      name: dto.name,
      description: dto.description,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar tema (incluye nivel de dominio manual)' })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateTopicDto,
  ) {
    return this.updateTopicUseCase.execute(id, userId, {
      name: dto.name,
      description: dto.description,
      masteryLevel: dto.masteryLevel,
      displayOrder: dto.displayOrder,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar tema' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.deleteTopicUseCase.execute(id, userId);
  }
}
