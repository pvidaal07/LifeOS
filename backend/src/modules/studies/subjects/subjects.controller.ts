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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@ApiTags('Subjects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('studies/subjects')
export class SubjectsController {
  constructor(private subjectsService: SubjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar asignaturas de un plan' })
  findByPlan(
    @Query('planId') planId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.subjectsService.findByPlan(planId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener asignatura con temas' })
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.subjectsService.findOne(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear asignatura' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateSubjectDto) {
    return this.subjectsService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar asignatura' })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.subjectsService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar asignatura' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.subjectsService.remove(id, userId);
  }
}
