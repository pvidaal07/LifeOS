import { Controller, Get, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { USE_CASE_TOKENS } from '../use-case-tokens';
import { GetDashboardUseCase } from '../../../application/use-cases/dashboard';
import { JwtAuthGuard, CurrentUser } from '../../auth';
import { ReviewScheduleWithTopic } from '../../../application/ports/review-repository.port';
import { StudySessionWithDetails } from '../../../application/ports/session-repository.port';
import { UpcomingReview } from '../../../application/ports/dashboard-repository.port';

@ApiTags('Inicio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    @Inject(USE_CASE_TOKENS.GetDashboardUseCase)
    private readonly getDashboardUseCase: GetDashboardUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener panel "Hoy"',
    description:
      'Devuelve repasos pendientes, sesiones del día, stats de la semana y actividad reciente.',
  })
  async getDashboard(@CurrentUser('sub') userId: string) {
    const data = await this.getDashboardUseCase.execute(userId);

    // Map domain-layer output to the old API contract shape.
    // The frontend expects flat Prisma-style records with nested topic/subject,
    // not domain entities wrapped in read-model DTOs.
    return {
      reviews: {
        pending: data.pendingReviews.map((r) =>
          this.mapReviewToApiContract(r),
        ),
        count: data.pendingReviewCount,
      },
      today: {
        sessionsCompleted: data.todaySessionsCompleted,
      },
      week: data.weekStats,
      recentActivity: data.recentActivity.map((s) =>
        this.mapSessionToApiContract(s),
      ),
      topicStats: data.topicStats,
      upcoming: data.upcomingReviews.map((r) =>
        this.mapUpcomingToApiContract(r),
      ),
    };
  }

  /**
   * Maps a ReviewScheduleWithTopic (domain read-model) to the flat shape
   * the frontend's ReviewSchedule type expects.
   */
  private mapReviewToApiContract(r: ReviewScheduleWithTopic) {
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
   * Maps a StudySessionWithDetails (domain read-model) to the flat shape
   * the frontend's StudySession type expects.
   */
  private mapSessionToApiContract(s: StudySessionWithDetails) {
    const session = s.session;
    return {
      id: session.id,
      topicId: session.topicId,
      sessionType: session.sessionType.value,
      durationMinutes: session.durationMinutes,
      qualityRating: session.qualityRating,
      notes: session.notes,
      studiedAt: session.studiedAt,
      topic: {
        name: s.topicName,
        subject: {
          name: s.subjectName,
          color: s.subjectColor,
        },
      },
    };
  }

  /**
   * Maps an UpcomingReview to the flat shape the frontend expects
   * (same ReviewSchedule shape with nested topic).
   */
  private mapUpcomingToApiContract(r: UpcomingReview) {
    return {
      id: r.id,
      scheduledDate: r.scheduledDate,
      topic: {
        name: r.topicName,
        subject: {
          name: r.subjectName,
          color: r.subjectColor,
        },
      },
    };
  }
}
