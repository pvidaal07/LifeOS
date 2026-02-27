import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { CompleteReviewDto } from './dto/complete-review.dto';

@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('studies/reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get('pending')
  @ApiOperation({ summary: 'Obtener repasos pendientes de hoy (ordenados por urgencia)' })
  getPending(@CurrentUser('sub') userId: string) {
    return this.reviewsService.getPendingReviews(userId);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Completar repaso y programar el siguiente' })
  complete(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CompleteReviewDto,
  ) {
    return this.reviewsService.completeReview(id, userId, dto);
  }

  @Post(':id/skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Saltar repaso (se reprograma para mañana)' })
  skip(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.reviewsService.skipReview(id, userId);
  }

  @Post('recalculate-urgency')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recalcular urgencia de todos los repasos pendientes' })
  recalculateUrgency(@CurrentUser('sub') userId: string) {
    return this.reviewsService.recalculateUrgency(userId);
  }
}
