import { ReviewRepositoryPort } from '../../ports/review-repository.port';
import { SpacedRepetitionService } from '../../../domain/review';

export class RecalculateUrgencyUseCase {
  private readonly spacedRepetition = new SpacedRepetitionService();

  constructor(private readonly reviewRepo: ReviewRepositoryPort) {}

  async execute(userId: string): Promise<number> {
    const pendingReviews = await this.reviewRepo.findAllPendingByUserId(userId);
    const now = new Date();

    const updates = pendingReviews.map((review) => ({
      id: review.id,
      urgencyScore: this.spacedRepetition.calculateUrgencyScore(
        review.scheduledDate,
        review.intervalDays,
        review.topicMasteryLevel,
        now,
      ),
    }));

    if (updates.length > 0) {
      await this.reviewRepo.updateMany(updates);
    }

    return updates.length;
  }
}
