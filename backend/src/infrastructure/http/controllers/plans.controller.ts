import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { USE_CASE_TOKENS } from '../use-case-tokens';
import { CreatePlanUseCase } from '../../../application/use-cases/plans';
import { GetPlansUseCase } from '../../../application/use-cases/plans';
import { GetPlanUseCase } from '../../../application/use-cases/plans';
import { UpdatePlanUseCase } from '../../../application/use-cases/plans';
import { DeletePlanUseCase } from '../../../application/use-cases/plans';
import { JwtAuthGuard, CurrentUser } from '../../auth';
import { CreatePlanDto, UpdatePlanDto } from '../dto/plans';
import { StudyPlanWithSubjects, StudyPlanWithFullDetails } from '../../../application/ports/study-plan-repository.port';
import { StudyPlan } from '../../../domain/study';

@ApiTags('Study Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('studies/plans')
export class PlansController {
  constructor(
    @Inject(USE_CASE_TOKENS.CreatePlanUseCase)
    private readonly createPlanUseCase: CreatePlanUseCase,
    @Inject(USE_CASE_TOKENS.GetPlansUseCase)
    private readonly getPlansUseCase: GetPlansUseCase,
    @Inject(USE_CASE_TOKENS.GetPlanUseCase)
    private readonly getPlanUseCase: GetPlanUseCase,
    @Inject(USE_CASE_TOKENS.UpdatePlanUseCase)
    private readonly updatePlanUseCase: UpdatePlanUseCase,
    @Inject(USE_CASE_TOKENS.DeletePlanUseCase)
    private readonly deletePlanUseCase: DeletePlanUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar planes de estudio' })
  async findAll(@CurrentUser('sub') userId: string) {
    const results = await this.getPlansUseCase.execute(userId);
    // Map to old Prisma-style shape: flat plan record with subjects[] containing _count.topics
    return results.map((r) => this.mapPlanWithSubjects(r));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener plan de estudio con asignaturas y temas' })
  async findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    const result = await this.getPlanUseCase.execute(id, userId);
    // Map to old Prisma-style shape: flat plan with subjects[] with nested topics[]
    return this.mapPlanWithFullDetails(result);
  }

  @Post()
  @ApiOperation({ summary: 'Crear plan de estudio' })
  async create(@CurrentUser('sub') userId: string, @Body() dto: CreatePlanDto) {
    const plan = await this.createPlanUseCase.execute(userId, {
      name: dto.name,
      description: dto.description,
    });
    return this.mapPlanFlat(plan);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar plan de estudio' })
  async update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdatePlanDto,
  ) {
    const plan = await this.updatePlanUseCase.execute(id, userId, {
      name: dto.name,
      description: dto.description,
      status: dto.status,
      displayOrder: dto.displayOrder,
    });
    return this.mapPlanFlat(plan);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar plan de estudio' })
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    const plan = await this.deletePlanUseCase.execute(id, userId);
    return this.mapPlanFlat(plan);
  }

  // ─── Presentation mapping helpers ─────────────────────

  /** Maps a StudyPlan domain entity to a flat Prisma-style record */
  private mapPlanFlat(plan: StudyPlan) {
    return plan.toJSON();
  }

  /** Maps findAll result: flat plan + subjects with _count.topics */
  private mapPlanWithSubjects(result: StudyPlanWithSubjects) {
    return {
      ...result.plan.toJSON(),
      subjects: result.subjects.map((s) => ({
        id: s.id,
        studyPlanId: s.studyPlanId,
        name: s.name,
        description: s.description,
        color: s.color,
        displayOrder: s.displayOrder,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        _count: s._count,
      })),
    };
  }

  /** Maps findOne result: flat plan + subjects with nested topics */
  private mapPlanWithFullDetails(result: StudyPlanWithFullDetails) {
    return {
      ...result.plan.toJSON(),
      subjects: result.subjects.map((s) => ({
        id: s.id,
        studyPlanId: s.studyPlanId,
        name: s.name,
        description: s.description,
        color: s.color,
        displayOrder: s.displayOrder,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        topics: s.topics,
      })),
    };
  }
}
