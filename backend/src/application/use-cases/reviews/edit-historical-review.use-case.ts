import { EntityNotFoundError, InvalidOperationError } from '../../../domain/common';
import { ReviewResult, ReviewSettings } from '../../../domain/review';
import { ReviewRepositoryPort } from '../../ports/review-repository.port';
import { ReviewSettingsRepositoryPort } from '../../ports/review-settings-repository.port';
import { TopicRepositoryPort } from '../../ports/topic-repository.port';
import {
  RecomputeTopicReviewChainOutput,
  RecomputeTopicReviewChainService,
} from './recompute-topic-review-chain.service';

export interface EditHistoricalReviewInput {
  reviewId: string;
  userId: string;
  completedDate?: Date;
  result?: string;
  durationMinutes?: number;
  qualityRating?: number;
}

export interface EditHistoricalReviewOutput extends RecomputeTopicReviewChainOutput {
  topicId: string;
  reviewId: string;
  anchorReviewNumber: number;
  recomputedReviewCount: number;
}

export class EditHistoricalReviewUseCase {
  private readonly recomputeService = new RecomputeTopicReviewChainService();

  constructor(
    private readonly reviewRepo: ReviewRepositoryPort,
    private readonly reviewSettingsRepo: ReviewSettingsRepositoryPort,
    private readonly topicRepo: TopicRepositoryPort,
  ) {}

  async execute(input: EditHistoricalReviewInput): Promise<EditHistoricalReviewOutput> {
    const review = await this.reviewRepo.findByIdForOwner(input.reviewId, input.userId);
    if (!review) {
      throw new EntityNotFoundError('Review', input.reviewId);
    }

    if (!review.status.isCompleted || !review.completedDate || !review.result) {
      throw new InvalidOperationError('Only completed reviews can be edited historically');
    }

    const settings = await this.reviewSettingsRepo.findByUserId(input.userId);
    const effectiveSettings = settings ?? ReviewSettings.createDefault('default', input.userId);

    const timeline = await this.reviewRepo.findTimelineByTopicId(review.topicId, input.userId);
    const referenceDate = new Date();

    const recomputed = this.recomputeService.execute({
      userId: input.userId,
      topicId: review.topicId,
      anchorReviewNumber: review.reviewNumber,
      reviewTimeline: timeline,
      reviewSettings: effectiveSettings,
      referenceDate,
      overrides: [
        {
          reviewNumber: review.reviewNumber,
          completedDate: input.completedDate ?? review.completedDate,
          result: input.result ? ReviewResult.create(input.result) : review.result,
        },
      ],
    });

    const persisted = await this.reviewRepo.editReviewAndReplaceTopicSuffix({
      userId: input.userId,
      reviewId: input.reviewId,
      topicId: review.topicId,
      anchorReviewNumber: review.reviewNumber,
      reviews: recomputed.recomputedSuffix,
      studySessionPatch: this.buildStudySessionPatch(review.completedDate, input),
    });

    if (!persisted) {
      throw new EntityNotFoundError('Review', input.reviewId);
    }

    await this.topicRepo.updateMastery(
      review.topicId,
      recomputed.systemMastery,
      recomputed.topicStatus,
    );

    return {
      topicId: review.topicId,
      reviewId: review.id,
      anchorReviewNumber: review.reviewNumber,
      recomputedReviewCount: recomputed.recomputedSuffix.length,
      ...recomputed,
    };
  }

  private buildStudySessionPatch(
    originalCompletedDate: Date,
    input: EditHistoricalReviewInput,
  ) {
    const hasPatch =
      input.completedDate !== undefined
      || input.durationMinutes !== undefined
      || input.qualityRating !== undefined;

    if (!hasPatch) {
      return undefined;
    }

    return {
      matchStudiedAt: originalCompletedDate,
      studiedAt: input.completedDate,
      durationMinutes: input.durationMinutes,
      qualityRating: input.qualityRating,
    };
  }
}
