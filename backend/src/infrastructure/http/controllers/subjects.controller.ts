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
import { CreateSubjectUseCase } from '../../../application/use-cases/subjects';
import { GetSubjectsUseCase } from '../../../application/use-cases/subjects';
import { GetSubjectUseCase } from '../../../application/use-cases/subjects';
import { UpdateSubjectUseCase } from '../../../application/use-cases/subjects';
import { DeleteSubjectUseCase } from '../../../application/use-cases/subjects';
import { JwtAuthGuard, CurrentUser } from '../../auth';
import { CreateSubjectDto, UpdateSubjectDto } from '../dto/subjects';
import { SubjectWithRelations, SubjectWithFullDetails } from '../../../application/ports/subject-repository.port';
import { Subject } from '../../../domain/study';

@ApiTags('Subjects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('studies/subjects')
export class SubjectsController {
  constructor(
    @Inject(USE_CASE_TOKENS.CreateSubjectUseCase)
    private readonly createSubjectUseCase: CreateSubjectUseCase,
    @Inject(USE_CASE_TOKENS.GetSubjectsUseCase)
    private readonly getSubjectsUseCase: GetSubjectsUseCase,
    @Inject(USE_CASE_TOKENS.GetSubjectUseCase)
    private readonly getSubjectUseCase: GetSubjectUseCase,
    @Inject(USE_CASE_TOKENS.UpdateSubjectUseCase)
    private readonly updateSubjectUseCase: UpdateSubjectUseCase,
    @Inject(USE_CASE_TOKENS.DeleteSubjectUseCase)
    private readonly deleteSubjectUseCase: DeleteSubjectUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar asignaturas de un plan' })
  async findByPlan(
    @Query('planId') planId: string,
    @CurrentUser('sub') userId: string,
  ) {
    const results = await this.getSubjectsUseCase.execute(planId, userId);
    // Map to old Prisma-style: flat subject with _count.topics and topics[]
    return results.map((r) => this.mapSubjectWithRelations(r));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener asignatura con temas' })
  async findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    const result = await this.getSubjectUseCase.execute(id, userId);
    // Map to old Prisma-style: flat subject with studyPlan and topics[]
    return this.mapSubjectWithDetails(result);
  }

  @Post()
  @ApiOperation({ summary: 'Crear asignatura' })
  async create(@CurrentUser('sub') userId: string, @Body() dto: CreateSubjectDto) {
    const subject = await this.createSubjectUseCase.execute(userId, {
      planId: dto.studyPlanId,
      name: dto.name,
      description: dto.description,
      color: dto.color,
    });
    return this.mapSubjectFlat(subject);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar asignatura' })
  async update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateSubjectDto,
  ) {
    const subject = await this.updateSubjectUseCase.execute(id, userId, {
      name: dto.name,
      description: dto.description,
      color: dto.color,
      displayOrder: dto.displayOrder,
    });
    return this.mapSubjectFlat(subject);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar asignatura' })
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    const subject = await this.deleteSubjectUseCase.execute(id, userId);
    return this.mapSubjectFlat(subject);
  }

  // ─── Presentation mapping helpers ─────────────────────

  /** Maps a Subject domain entity to a flat Prisma-style record */
  private mapSubjectFlat(subject: Subject) {
    return subject.toJSON();
  }

  /** Maps findAll result: flat subject with _count.topics and topics[] */
  private mapSubjectWithRelations(result: SubjectWithRelations) {
    return {
      ...result.subject.toJSON(),
      _count: result._count,
      topics: result.topics,
    };
  }

  /** Maps findOne result: flat subject with studyPlan and topics[] */
  private mapSubjectWithDetails(result: SubjectWithFullDetails) {
    return {
      ...result.subject.toJSON(),
      studyPlan: result.studyPlan,
      topics: result.topics,
    };
  }
}
