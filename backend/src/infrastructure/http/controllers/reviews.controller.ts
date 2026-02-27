import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Inject,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { USE_CASE_TOKENS } from '../use-case-tokens';
import { GetPendingReviewsUseCase } from '../../../application/use-cases/reviews';
import { CompleteReviewUseCase } from '../../../application/use-cases/reviews';
import { SkipReviewUseCase } from '../../../application/use-cases/reviews';
import { RecalculateUrgencyUseCase } from '../../../application/use-cases/reviews';
import { JwtAuthGuard, CurrentUser } from '../../auth';
import { CompleteReviewDto } from '../dto/reviews';

@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('studies/reviews')
export class ReviewsController {
  constructor(
    @Inject(USE_CASE_TOKENS.GetPendingReviewsUseCase)
    private readonly getPendingReviewsUseCase: GetPendingReviewsUseCase,
    @Inject(USE_CASE_TOKENS.CompleteReviewUseCase)
    private readonly completeReviewUseCase: CompleteReviewUseCase,
    @Inject(USE_CASE_TOKENS.SkipReviewUseCase)
    private readonly skipReviewUseCase: SkipReviewUseCase,
    @Inject(USE_CASE_TOKENS.RecalculateUrgencyUseCase)
    private readonly recalculateUrgencyUseCase: RecalculateUrgencyUseCase,
  ) {}

  @Get('pending')
  @ApiOperation({ summary: 'Obtener repasos pendientes de hoy (ordenados por urgencia)' })
  getPending(@CurrentUser('sub') userId: string) {
    return this.getPendingReviewsUseCase.execute(userId);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Completar repaso y programar el siguiente' })
  complete(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CompleteReviewDto,
  ) {
    return this.completeReviewUseCase.execute({
      reviewId: id,
      userId,
      result: dto.result,
      durationMinutes: dto.durationMinutes,
      qualityRating: dto.qualityRating,
      notes: dto.notes,
    });
  }

  @Post(':id/skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Saltar repaso (se reprograma para mañana)' })
  skip(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.skipReviewUseCase.execute(id, userId);
  }

  @Post('recalculate-urgency')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recalcular urgencia de todos los repasos pendientes' })
  recalculateUrgency(@CurrentUser('sub') userId: string) {
    return this.recalculateUrgencyUseCase.execute(userId);
  }
}
