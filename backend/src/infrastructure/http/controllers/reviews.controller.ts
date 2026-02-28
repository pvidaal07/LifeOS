import {
  Controller,
  Get,
  Post,
  Patch,
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
import { GetUpcomingReviewsUseCase } from '../../../application/use-cases/reviews';
import { GetReviewSettingsUseCase } from '../../../application/use-cases/reviews';
import { UpdateReviewSettingsUseCase } from '../../../application/use-cases/reviews';
import { JwtAuthGuard, CurrentUser } from '../../auth';
import { CompleteReviewDto, UpdateReviewSettingsDto } from '../dto/reviews';
import { ReviewScheduleWithTopic } from '../../../application/ports/review-repository.port';
import { ReviewSchedule, ReviewSettings } from '../../../domain/review';

@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('studies/reviews')
export class ReviewsController {
  constructor(
    @Inject(USE_CASE_TOKENS.GetPendingReviewsUseCase)
    private readonly getPendingReviewsUseCase: GetPendingReviewsUseCase,
    @Inject(USE_CASE_TOKENS.GetUpcomingReviewsUseCase)
    private readonly getUpcomingReviewsUseCase: GetUpcomingReviewsUseCase,
    @Inject(USE_CASE_TOKENS.CompleteReviewUseCase)
    private readonly completeReviewUseCase: CompleteReviewUseCase,
    @Inject(USE_CASE_TOKENS.SkipReviewUseCase)
    private readonly skipReviewUseCase: SkipReviewUseCase,
    @Inject(USE_CASE_TOKENS.RecalculateUrgencyUseCase)
    private readonly recalculateUrgencyUseCase: RecalculateUrgencyUseCase,
    @Inject(USE_CASE_TOKENS.GetReviewSettingsUseCase)
    private readonly getReviewSettingsUseCase: GetReviewSettingsUseCase,
    @Inject(USE_CASE_TOKENS.UpdateReviewSettingsUseCase)
    private readonly updateReviewSettingsUseCase: UpdateReviewSettingsUseCase,
  ) {}

  @Get('pending')
  @ApiOperation({ summary: 'Obtener repasos pendientes de hoy (ordenados por urgencia)' })
  async getPending(@CurrentUser('sub') userId: string) {
    const results = await this.getPendingReviewsUseCase.execute(userId);
    return results.map((r) => this.mapReviewWithTopic(r));
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Obtener repasos programados para los proximos dias' })
  async getUpcoming(@CurrentUser('sub') userId: string) {
    const results = await this.getUpcomingReviewsUseCase.execute(userId);
    return results.map((r) => this.mapReviewWithTopic(r));
  }

  @Get('settings')
  @ApiOperation({ summary: 'Obtener configuración de repasos del usuario' })
  async getSettings(@CurrentUser('sub') userId: string) {
    const settings = await this.getReviewSettingsUseCase.execute(userId);
    return ReviewsController.mapSettings(settings);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Actualizar configuración de repasos' })
  async updateSettings(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateReviewSettingsDto,
  ) {
    const settings = await this.updateReviewSettingsUseCase.execute(userId, {
      baseIntervals: dto.baseIntervals,
      perfectMultiplier: dto.perfectMultiplier,
      goodMultiplier: dto.goodMultiplier,
      regularMultiplier: dto.regularMultiplier,
      badReset: dto.badReset,
    });
    return ReviewsController.mapSettings(settings);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Completar repaso y programar el siguiente' })
  async complete(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CompleteReviewDto,
  ) {
    const result = await this.completeReviewUseCase.execute({
      reviewId: id,
      userId,
      result: dto.result,
      durationMinutes: dto.durationMinutes,
      qualityRating: dto.qualityRating,
      notes: dto.notes,
    });
    // Old API returned { completedReview, nextReview } as flat Prisma records
    return {
      completedReview: this.mapReviewFlat(result.completedReview),
      nextReview: this.mapReviewFlat(result.nextReview),
    };
  }

  @Post(':id/skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Saltar repaso (se reprograma para mañana)' })
  async skip(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    const rescheduled = await this.skipReviewUseCase.execute(id, userId);
    // Old API returned the rescheduled review as a flat Prisma record
    return this.mapReviewFlat(rescheduled);
  }

  @Post('recalculate-urgency')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recalcular urgencia de todos los repasos pendientes' })
  async recalculateUrgency(@CurrentUser('sub') userId: string) {
    // Old API returned void (no response body)
    await this.recalculateUrgencyUseCase.execute(userId);
  }

  // ─── Presentation mapping helpers ─────────────────────

  /**
   * Maps a ReviewSettings domain entity to the API response shape.
   */
  private static mapSettings(settings: ReviewSettings) {
    return {
      id: settings.id,
      userId: settings.userId,
      baseIntervals: [...settings.baseIntervals],
      perfectMultiplier: settings.perfectMultiplier,
      goodMultiplier: settings.goodMultiplier,
      regularMultiplier: settings.regularMultiplier,
      badReset: settings.badReset,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }

  /**
   * Maps a ReviewScheduleWithTopic (domain read-model) to the old Prisma-style shape
   * with nested topic: { name, subject: { name, color, studyPlan: { name } } }.
   */
  private mapReviewWithTopic(r: ReviewScheduleWithTopic) {
    const review = r.review;
    return {
      id: review.id,
      topicId: review.topicId,
      scheduledDate: review.scheduledDate,
      completedDate: review.completedDate,
      status: review.status.value,
      result: review.result ? review.result.value : null,
      urgencyScore: review.urgencyScore,
      intervalDays: review.intervalDays,
      reviewNumber: review.reviewNumber,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      topic: {
        name: r.topicName,
        subject: {
          name: r.subjectName,
          color: r.subjectColor,
          studyPlan: {
            name: r.planName,
          },
        },
      },
    };
  }

  /**
   * Maps a ReviewSchedule domain entity to a flat Prisma-style record
   * (no topic nesting — used for complete/skip responses).
   */
  private mapReviewFlat(review: ReviewSchedule) {
    return {
      id: review.id,
      userId: review.userId,
      topicId: review.topicId,
      scheduledDate: review.scheduledDate,
      completedDate: review.completedDate,
      status: review.status.value,
      result: review.result ? review.result.value : null,
      urgencyScore: review.urgencyScore,
      intervalDays: review.intervalDays,
      reviewNumber: review.reviewNumber,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}
