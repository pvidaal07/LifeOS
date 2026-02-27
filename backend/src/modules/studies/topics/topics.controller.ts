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
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

@ApiTags('Topics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('studies/topics')
export class TopicsController {
  constructor(private topicsService: TopicsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar temas de una asignatura' })
  findBySubject(
    @Query('subjectId') subjectId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.topicsService.findBySubject(subjectId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener tema con sesiones y repasos' })
  findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.topicsService.findOne(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear tema' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateTopicDto) {
    return this.topicsService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar tema (incluye nivel de dominio manual)' })
  update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateTopicDto,
  ) {
    return this.topicsService.update(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar tema' })
  remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.topicsService.remove(id, userId);
  }
}
