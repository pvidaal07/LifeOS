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
  findAll(@CurrentUser('sub') userId: string) {
    return this.getPlansUseCase.execute(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener plan de estudio con asignaturas y temas' })
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.getPlanUseCase.execute(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear plan de estudio' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreatePlanDto) {
    return this.createPlanUseCase.execute(userId, {
      name: dto.name,
      description: dto.description,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar plan de estudio' })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.updatePlanUseCase.execute(id, userId, {
      name: dto.name,
      description: dto.description,
      status: dto.status,
      displayOrder: dto.displayOrder,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar plan de estudio' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.deletePlanUseCase.execute(id, userId);
  }
}
