import { ReviewRepositoryPort } from '../../ports/review-repository.port';
import { ReviewSettingsRepositoryPort } from '../../ports/review-settings-repository.port';
import { TopicRepositoryPort } from '../../ports/topic-repository.port';
import { SessionRepositoryPort } from '../../ports/session-repository.port';
import { ReviewSchedule, ReviewResult, ReviewSettings, SpacedRepetitionService } from '../../../domain/review';
import { StudySession, SessionType } from '../../../domain/study';
import { EntityNotFoundError } from '../../../domain/common';

export interface CompleteReviewInput {
  reviewId: string;
  userId: string;
  result: string;
  durationMinutes?: number;
  qualityRating?: number;
  notes?: string;
}

export interface CompleteReviewOutput {
  completedReview: ReviewSchedule;
  nextReview: ReviewSchedule;
  systemMastery: number;
  topicStatus: string;
}

export class CompleteReviewUseCase {
  private readonly spacedRepetition = new SpacedRepetitionService();

  constructor(
    private readonly reviewRepo: ReviewRepositoryPort,
    private readonly reviewSettingsRepo: ReviewSettingsRepositoryPort,
    private readonly topicRepo: TopicRepositoryPort,
    private readonly sessionRepo: SessionRepositoryPort,
  ) {}

  async execute(input: CompleteReviewInput): Promise<CompleteReviewOutput> {
    // 1. Find pending review
    const review = await this.reviewRepo.findPendingById(input.reviewId, input.userId);
    if (!review) {
      throw new EntityNotFoundError('Review', input.reviewId);
    }

    // 2. Load user's review settings (fall back to defaults)
    const settings = await this.reviewSettingsRepo.findByUserId(input.userId);
    const effectiveSettings = settings ?? ReviewSettings.createDefault('default', input.userId);

    // 3. Complete the review (domain operation — validates state transition)
    const result = ReviewResult.create(input.result);
    review.complete(result, new Date());

    // 4. Calculate next interval using spaced repetition algorithm
    const nextIntervalDays = this.spacedRepetition.calculateNextInterval(
      review.intervalDays,
      result,
      effectiveSettings,
    );
    const nextDate = this.spacedRepetition.calculateNextReviewDate(new Date(), nextIntervalDays);

    // 5. Create next review schedule
    const nextReview = ReviewSchedule.scheduleNext({
      id: crypto.randomUUID(),
      userId: input.userId,
      topicId: review.topicId,
      scheduledDate: nextDate,
      intervalDays: nextIntervalDays,
      reviewNumber: review.reviewNumber + 1,
    });

    // 6. Create a study session for this review
    const session = StudySession.create({
      id: crypto.randomUUID(),
      userId: input.userId,
      topicId: review.topicId,
      sessionType: SessionType.REVIEW,
      durationMinutes: input.durationMinutes ?? null,
      qualityRating: input.qualityRating ?? null,
      notes: input.notes ?? null,
    });

    // 7. Calculate updated system mastery
    const completedReviews = await this.reviewRepo.findCompletedByTopicId(review.topicId);
    // Add the just-completed review to the list
    completedReviews.push({
      result: result.value,
      intervalDays: review.intervalDays,
      completedDate: new Date(),
    });

    // Map port CompletedReviewData (raw strings) to domain CompletedReviewData (ReviewResult VOs)
    const systemMastery = this.spacedRepetition.calculateSystemMastery(
      completedReviews.map((r) => ({
        result: ReviewResult.create(r.result),
        intervalDays: r.intervalDays,
        completedDate: r.completedDate,
      })),
    );
    const topicStatus = this.spacedRepetition.determineTopicStatus(systemMastery);

    // 8. Persist all changes
    await this.reviewRepo.save(review); // update completed review
    await this.reviewRepo.save(nextReview); // create next review
    await this.sessionRepo.save(session); // create study session
    await this.topicRepo.updateMastery(review.topicId, systemMastery, topicStatus);

    return {
      completedReview: review,
      nextReview,
      systemMastery,
      topicStatus,
    };
  }
}
