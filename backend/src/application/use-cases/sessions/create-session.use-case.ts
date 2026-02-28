import { StudySession, SessionType, TopicNotFoundError } from '../../../domain/study';
import { ReviewSchedule, ReviewResult, SpacedRepetitionService } from '../../../domain/review';
import { SessionRepositoryPort, StudySessionWithDetails } from '../../ports/session-repository.port';
import { TopicRepositoryPort } from '../../ports/topic-repository.port';
import { ReviewRepositoryPort } from '../../ports/review-repository.port';
import { ReviewSettingsRepositoryPort } from '../../ports/review-settings-repository.port';
import { ReviewCompletionService } from '../reviews/review-completion.service';

export interface CreateSessionInput {
  topicId: string;
  sessionType?: string;
  durationMinutes?: number | null;
  qualityRating?: number | null;
  notes?: string | null;
  studiedAt?: Date;
}

export class CreateSessionUseCase {
  private readonly completionService: ReviewCompletionService;

  constructor(
    private readonly sessionRepo: SessionRepositoryPort,
    private readonly topicRepo: TopicRepositoryPort,
    private readonly reviewRepo: ReviewRepositoryPort,
    private readonly reviewSettingsRepo: ReviewSettingsRepositoryPort,
  ) {
    this.completionService = new ReviewCompletionService(
      reviewRepo,
      reviewSettingsRepo,
      topicRepo,
    );
  }

  async execute(userId: string, input: CreateSessionInput): Promise<StudySessionWithDetails> {
    // Verify the topic exists and belongs to the user
    const topicDetails = await this.topicRepo.findByIdWithOwnership(input.topicId, userId);
    if (!topicDetails || topicDetails.subject.studyPlan.userId !== userId) {
      throw new TopicNotFoundError(input.topicId);
    }

    // Count existing sessions for this topic to determine if first time
    const sessionCount = await this.topicRepo.countSessionsByTopicAndUser(
      input.topicId,
      userId,
    );

    const isFirstTime = sessionCount === 0;
    const sessionType = isFirstTime
      ? SessionType.FIRST_TIME
      : input.sessionType
        ? SessionType.create(input.sessionType)
        : SessionType.PRACTICE;

    const session = StudySession.create({
      id: crypto.randomUUID(),
      userId,
      topicId: input.topicId,
      sessionType,
      durationMinutes: input.durationMinutes,
      qualityRating: input.qualityRating,
      notes: input.notes,
      studiedAt: input.studiedAt,
    });

    const saved = await this.sessionRepo.save(session);

    // On first session: schedule first review and mark topic in_progress
    if (isFirstTime) {
      const topic = topicDetails.topic;
      topic.markInProgress();
      await this.topicRepo.update(topic);

      // Schedule first review
      const settings = await this.reviewSettingsRepo.findByUserId(userId);
      const firstInterval = settings?.getFirstInterval() ?? 1;
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + firstInterval);

      const review = ReviewSchedule.scheduleFirst({
        id: crypto.randomUUID(),
        userId,
        topicId: input.topicId,
        scheduledDate,
        intervalDays: firstInterval,
      });

      await this.reviewRepo.save(review);
    }

    // When session type is "review", auto-complete pending review + recalculate mastery
    if (sessionType.value === 'review') {
      await this.completeReviewForTopic(userId, input.topicId, input.qualityRating ?? null);
    }

    return saved;
  }

  /**
   * If a pending ReviewSchedule exists for the topic, complete it automatically
   * and recalculate the topic's system mastery level.
   *
   * Uses the shared ReviewCompletionService to ensure consistent behavior
   * with CompleteReviewUseCase (same algorithm, same mastery recalculation).
   */
  private async completeReviewForTopic(
    userId: string,
    topicId: string,
    qualityRating: number | null,
  ): Promise<void> {
    const pendingReview = await this.reviewRepo.findPendingByTopicId(topicId, userId);
    if (!pendingReview) return;

    const result = this.mapQualityToResult(qualityRating);
    await this.completionService.completeAndScheduleNext(pendingReview, result, userId);
  }

  /**
   * Map qualityRating (1-5) to ReviewResult.
   * 5 → perfect, 4 → good, 3 → regular, 1-2 → bad, null → good (default)
   */
  private mapQualityToResult(qualityRating: number | null): ReviewResult {
    if (qualityRating === null || qualityRating === undefined) {
      return ReviewResult.GOOD;
    }
    switch (qualityRating) {
      case 5: return ReviewResult.PERFECT;
      case 4: return ReviewResult.GOOD;
      case 3: return ReviewResult.REGULAR;
      default: return ReviewResult.BAD;
    }
  }
}
