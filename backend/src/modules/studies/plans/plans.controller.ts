import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@ApiTags('Study Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('studies/plans')
export class PlansController {
  constructor(private plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'Listar planes de estudio' })
  findAll(@CurrentUser('sub') userId: string) {
    return this.plansService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener plan de estudio con asignaturas y temas' })
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.plansService.findOne(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear plan de estudio' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreatePlanDto) {
    return this.plansService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar plan de estudio' })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdatePlanDto,
  ) {
    return this.plansService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar plan de estudio' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.plansService.remove(id, userId);
  }
}
