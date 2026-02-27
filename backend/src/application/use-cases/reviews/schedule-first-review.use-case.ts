import { ReviewRepositoryPort } from '../../ports/review-repository.port';
import { ReviewSettingsRepositoryPort } from '../../ports/review-settings-repository.port';
import { ReviewSchedule, ReviewSettings } from '../../../domain/review';

export class ScheduleFirstReviewUseCase {
  constructor(
    private readonly reviewRepo: ReviewRepositoryPort,
    private readonly reviewSettingsRepo: ReviewSettingsRepositoryPort,
  ) {}

  async execute(userId: string, topicId: string): Promise<ReviewSchedule> {
    const settings = await this.reviewSettingsRepo.findByUserId(userId);
    const effectiveSettings = settings ?? ReviewSettings.createDefault('default', userId);

    const firstInterval = effectiveSettings.getFirstInterval();
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + firstInterval);

    const review = ReviewSchedule.scheduleFirst({
      id: crypto.randomUUID(),
      userId,
      topicId,
      scheduledDate,
      intervalDays: firstInterval,
    });

    await this.reviewRepo.save(review);
    return review;
  }
}
