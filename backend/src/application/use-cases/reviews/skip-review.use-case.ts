import { ReviewRepositoryPort } from '../../ports/review-repository.port';
import { ReviewSchedule } from '../../../domain/review';
import { EntityNotFoundError } from '../../../domain/common';

export class SkipReviewUseCase {
  constructor(private readonly reviewRepo: ReviewRepositoryPort) {}

  async execute(reviewId: string, userId: string): Promise<ReviewSchedule> {
    const review = await this.reviewRepo.findPendingById(reviewId, userId);
    if (!review) {
      throw new EntityNotFoundError('Review', reviewId);
    }

    // Skip the current review (domain operation — validates state transition)
    review.skip();

    // Schedule same review for tomorrow with same interval
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const rescheduled = ReviewSchedule.scheduleNext({
      id: crypto.randomUUID(),
      userId,
      topicId: review.topicId,
      scheduledDate: tomorrow,
      intervalDays: review.intervalDays,
      reviewNumber: review.reviewNumber, // same number — not a new review
    });

    await this.reviewRepo.save(review);
    await this.reviewRepo.save(rescheduled);

    return rescheduled;
  }
}
