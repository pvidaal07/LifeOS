import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';

@ApiTags('Study Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('studies/sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar sesión de estudio',
    description: 'Si es la primera vez que se estudia el tema, programa automáticamente el primer repaso.',
  })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateSessionDto) {
    return this.sessionsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener sesiones de un tema' })
  findByTopic(
    @Query('topicId') topicId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.sessionsService.findByTopic(topicId, userId);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Obtener sesiones recientes' })
  findRecent(
    @CurrentUser('sub') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.sessionsService.findRecent(userId, limit || 10);
  }
}
