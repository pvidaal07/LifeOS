import { ReviewRepositoryPort, ReviewScheduleWithTopic } from '../../ports/review-repository.port';

export class GetPendingReviewsUseCase {
  constructor(private readonly reviewRepo: ReviewRepositoryPort) {}

  async execute(userId: string): Promise<ReviewScheduleWithTopic[]> {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return this.reviewRepo.findPendingByUserId(userId, today);
  }
}
