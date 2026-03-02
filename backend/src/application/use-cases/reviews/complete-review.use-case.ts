import { ReviewRepositoryPort } from '../../ports/review-repository.port';
import { ReviewSettingsRepositoryPort } from '../../ports/review-settings-repository.port';
import { TopicRepositoryPort } from '../../ports/topic-repository.port';
import { SessionRepositoryPort } from '../../ports/session-repository.port';
import { ReviewSchedule, ReviewResult } from '../../../domain/review';
import { StudySession, SessionType } from '../../../domain/study';
import { EntityNotFoundError } from '../../../domain/common';
import { ReviewCompletionService, ReviewCompletionResult } from './review-completion.service';

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
  private readonly completionService: ReviewCompletionService;

  constructor(
    private readonly reviewRepo: ReviewRepositoryPort,
    private readonly reviewSettingsRepo: ReviewSettingsRepositoryPort,
    private readonly topicRepo: TopicRepositoryPort,
    private readonly sessionRepo: SessionRepositoryPort,
  ) {
    this.completionService = new ReviewCompletionService(
      reviewRepo,
      reviewSettingsRepo,
      topicRepo,
    );
  }

  async execute(input: CompleteReviewInput): Promise<CompleteReviewOutput> {
    // 1. Find pending review
    const review = await this.reviewRepo.findPendingById(input.reviewId, input.userId);
    if (!review) {
      throw new EntityNotFoundError('Review', input.reviewId);
    }

    // 2. Complete review and schedule next (shared logic)
    const result = ReviewResult.create(input.result);
    const completion = await this.completionService.completeAndScheduleNext(
      review,
      result,
      input.userId,
    );

    // 3. Create a study session for this review
    const session = StudySession.create({
      id: crypto.randomUUID(),
      userId: input.userId,
      topicId: review.topicId,
      sessionType: SessionType.REVIEW,
      durationMinutes: input.durationMinutes ?? null,
      qualityRating: input.qualityRating ?? null,
      notes: input.notes ?? null,
    });
    await this.sessionRepo.save(session);

    return completion;
  }
}
