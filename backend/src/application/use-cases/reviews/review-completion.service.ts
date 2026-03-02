import { ReviewSchedule, ReviewResult, ReviewSettings, SpacedRepetitionService } from '../../../domain/review';
import { ReviewRepositoryPort } from '../../ports/review-repository.port';
import { ReviewSettingsRepositoryPort } from '../../ports/review-settings-repository.port';
import { TopicRepositoryPort } from '../../ports/topic-repository.port';

/**
 * Shared application service that encapsulates the review completion workflow:
 * 1. Complete the pending review (domain state transition)
 * 2. Calculate next interval using spaced repetition algorithm
 * 3. Schedule the next review
 * 4. Recalculate topic system mastery
 * 5. Persist all changes
 *
 * This eliminates logic duplication between CompleteReviewUseCase and
 * CreateSessionUseCase (which auto-completes reviews for "review" sessions).
 */
export interface ReviewCompletionResult {
  completedReview: ReviewSchedule;
  nextReview: ReviewSchedule;
  systemMastery: number;
  topicStatus: string;
}

export class ReviewCompletionService {
  private readonly spacedRepetition = new SpacedRepetitionService();

  constructor(
    private readonly reviewRepo: ReviewRepositoryPort,
    private readonly reviewSettingsRepo: ReviewSettingsRepositoryPort,
    private readonly topicRepo: TopicRepositoryPort,
  ) {}

  /**
   * Complete a pending review and schedule the next one.
   *
   * @param review - The pending ReviewSchedule to complete (must be in 'pending' status)
   * @param result - The review result (perfect/good/regular/bad)
   * @param userId - The user who completed the review
   * @returns ReviewCompletionResult with the completed review, next review, mastery, and status
   */
  async completeAndScheduleNext(
    review: ReviewSchedule,
    result: ReviewResult,
    userId: string,
  ): Promise<ReviewCompletionResult> {
    // 1. Complete the review (domain operation — validates state transition)
    const now = new Date();
    review.complete(result, now);

    // 2. Load user's review settings (fall back to defaults)
    const settings = await this.reviewSettingsRepo.findByUserId(userId);
    const effectiveSettings = settings ?? ReviewSettings.createDefault('default', userId);

    // 3. Calculate next interval using spaced repetition algorithm
    const nextIntervalDays = this.spacedRepetition.calculateNextInterval(
      review.intervalDays,
      result,
      effectiveSettings,
    );

    // 4. Calculate next review date
    // Use the later of scheduledDate or now as base date:
    // - Early completion → count from original scheduledDate (preserves calendar spacing)
    // - Late completion  → count from today (already past schedule)
    const baseDate = review.scheduledDate > now ? review.scheduledDate : now;
    const nextDate = this.spacedRepetition.calculateNextReviewDate(baseDate, nextIntervalDays);

    // 5. Create next review schedule
    const nextReview = ReviewSchedule.scheduleNext({
      id: crypto.randomUUID(),
      userId,
      topicId: review.topicId,
      scheduledDate: nextDate,
      intervalDays: nextIntervalDays,
      reviewNumber: review.reviewNumber + 1,
    });

    // 6. Calculate updated system mastery
    const completedReviews = await this.reviewRepo.findCompletedByTopicId(review.topicId, userId);
    completedReviews.push({
      result: result.value,
      intervalDays: review.intervalDays,
      completedDate: now,
    });

    const systemMastery = this.spacedRepetition.calculateSystemMastery(
      completedReviews.map((r) => ({
        result: ReviewResult.create(r.result),
        intervalDays: r.intervalDays,
        completedDate: r.completedDate,
      })),
    );
    const topicStatus = this.spacedRepetition.determineTopicStatus(systemMastery);

    // 7. Persist: completed review, next review, mastery update
    await this.reviewRepo.save(review);
    await this.reviewRepo.save(nextReview);
    await this.topicRepo.updateMastery(review.topicId, systemMastery, topicStatus);

    return {
      completedReview: review,
      nextReview,
      systemMastery,
      topicStatus,
    };
  }
}
