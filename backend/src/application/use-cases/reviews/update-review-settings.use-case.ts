import { ReviewSettingsRepositoryPort } from '../../ports/review-settings-repository.port';
import { ReviewSettings } from '../../../domain/review';

export interface UpdateReviewSettingsInput {
  baseIntervals?: number[];
  perfectMultiplier?: number;
  goodMultiplier?: number;
  regularMultiplier?: number;
  badReset?: boolean;
}

export class UpdateReviewSettingsUseCase {
  constructor(
    private readonly reviewSettingsRepo: ReviewSettingsRepositoryPort,
  ) {}

  async execute(userId: string, input: UpdateReviewSettingsInput): Promise<ReviewSettings> {
    let settings = await this.reviewSettingsRepo.findByUserId(userId);

    if (!settings) {
      // Create default settings if none exist, then apply updates
      settings = ReviewSettings.createDefault(crypto.randomUUID(), userId);
    }

    settings.update({
      baseIntervals: input.baseIntervals,
      perfectMultiplier: input.perfectMultiplier,
      goodMultiplier: input.goodMultiplier,
      regularMultiplier: input.regularMultiplier,
      badReset: input.badReset,
    });

    return this.reviewSettingsRepo.upsert(settings);
  }
}
