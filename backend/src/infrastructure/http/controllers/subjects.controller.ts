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
  findByPlan(
    @Query('planId') planId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.getSubjectsUseCase.execute(planId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener asignatura con temas' })
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.getSubjectUseCase.execute(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear asignatura' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateSubjectDto) {
    return this.createSubjectUseCase.execute(userId, {
      planId: dto.studyPlanId,
      name: dto.name,
      description: dto.description,
      color: dto.color,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar asignatura' })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.updateSubjectUseCase.execute(id, userId, {
      name: dto.name,
      description: dto.description,
      color: dto.color,
      displayOrder: dto.displayOrder,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar asignatura' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.deleteSubjectUseCase.execute(id, userId);
  }
}
