import { ReviewRepositoryPort, ReviewScheduleWithTopic } from '../../ports/review-repository.port';

export class GetUpcomingReviewsUseCase {
  constructor(private readonly reviewRepo: ReviewRepositoryPort) {}

  async execute(userId: string, limit: number = 20): Promise<ReviewScheduleWithTopic[]> {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return this.reviewRepo.findUpcomingByUserId(userId, today, limit);
  }
}
