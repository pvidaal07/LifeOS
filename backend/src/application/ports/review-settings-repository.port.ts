import { ReviewSettings } from '../../domain/review';

export interface ReviewSettingsRepositoryPort {
  findByUserId(userId: string): Promise<ReviewSettings | null>;
}
