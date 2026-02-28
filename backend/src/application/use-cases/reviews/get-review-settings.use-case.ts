import { ReviewSettingsRepositoryPort } from '../../ports/review-settings-repository.port';
import { ReviewSettings } from '../../../domain/review';

export class GetReviewSettingsUseCase {
  constructor(
    private readonly reviewSettingsRepo: ReviewSettingsRepositoryPort,
  ) {}

  async execute(userId: string): Promise<ReviewSettings> {
    const settings = await this.reviewSettingsRepo.findByUserId(userId);
    return settings ?? ReviewSettings.createDefault('default', userId);
  }
}
