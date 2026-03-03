import { EntityNotFoundError } from '../../../domain/common';
import {
  ReviewResult,
  ReviewSettings,
  SpacedRepetitionService,
} from '../../../domain/review';
import { StudySession, StudySessionNotFoundError } from '../../../domain/study';
import { ReviewRepositoryPort } from '../../ports/review-repository.port';
import {
  SessionEditInput,
  SessionRepositoryPort,
} from '../../ports/session-repository.port';
import { ReviewSettingsRepositoryPort } from '../../ports/review-settings-repository.port';
import { TopicRepositoryPort } from '../../ports/topic-repository.port';
import { RecomputeTopicReviewChainService } from '../reviews/recompute-topic-review-chain.service';

export interface EditHistoricalSessionInput {
  sessionId: string;
  userId: string;
  studiedAt?: Date;
  durationMinutes?: number | null;
  qualityRating?: number | null;
}

export interface EditHistoricalSessionOutput {
  sessionId: string;
  topicId: string;
  anchorReviewNumber: number;
  recomputedReviewCount: number;
  systemMastery: number;
  topicStatus: 'mastered' | 'in_progress';
}

export class EditHistoricalSessionUseCase {
  private readonly recomputeService = new RecomputeTopicReviewChainService();
  private readonly spacedRepetition = new SpacedRepetitionService();

  constructor(
    private readonly sessionRepo: SessionRepositoryPort,
    private readonly reviewRepo: ReviewRepositoryPort,
    private readonly reviewSettingsRepo: ReviewSettingsRepositoryPort,
    private readonly topicRepo: TopicRepositoryPort,
  ) {}

  async execute(input: EditHistoricalSessionInput): Promise<EditHistoricalSessionOutput> {
    const existingSession = await this.sessionRepo.findByIdForOwner(input.sessionId, input.userId);
    if (!existingSession) {
      throw new StudySessionNotFoundError(input.sessionId);
    }

    const sessionEditInput: SessionEditInput = {
      studiedAt: input.studiedAt ?? existingSession.studiedAt,
      durationMinutes: input.durationMinutes ?? existingSession.durationMinutes,
      qualityRating: input.qualityRating ?? existingSession.qualityRating,
    };

    const sessionTimeline = await this.sessionRepo.findTimelineByTopicId(
      existingSession.topicId,
      input.userId,
    );
    const reviewTimeline = await this.reviewRepo.findTimelineByTopicId(
      existingSession.topicId,
      input.userId,
    );

    const timelineWithEdit = this.buildEditedSessionTimeline(
      sessionTimeline,
      existingSession.id,
      sessionEditInput,
    );

    const firstSession = timelineWithEdit.find(
      (session) => session.sessionType.value === 'first_time',
    );

    const affectsReviewChain =
      existingSession.sessionType.value === 'first_time'
      || existingSession.sessionType.value === 'review';

    let anchorReviewNumber = this.getMaxReviewNumber(reviewTimeline) + 1;
    let recomputedReviews = [] as typeof reviewTimeline;
    let systemMastery = this.calculateCurrentMastery(reviewTimeline);
    let topicStatus: 'mastered' | 'in_progress' = systemMastery >= 7 ? 'mastered' : 'in_progress';

    if (affectsReviewChain) {
      const settings = await this.reviewSettingsRepo.findByUserId(input.userId);
      const effectiveSettings = settings ?? ReviewSettings.createDefault('default', input.userId);

      anchorReviewNumber = existingSession.sessionType.value === 'first_time'
        ? 1
        : this.resolveAnchorForReviewSession(timelineWithEdit, existingSession.id);

      const recomputed = this.recomputeService.execute({
        userId: input.userId,
        topicId: existingSession.topicId,
        anchorReviewNumber,
        reviewTimeline,
        reviewSettings: effectiveSettings,
        referenceDate: new Date(),
        firstReviewAnchorDate: firstSession?.studiedAt,
        overrides: existingSession.sessionType.value === 'review'
          ? [
            {
              reviewNumber: anchorReviewNumber,
              completedDate: sessionEditInput.studiedAt,
              result: this.mapQualityToResult(sessionEditInput.qualityRating),
            },
          ]
          : [],
      });

      recomputedReviews = recomputed.recomputedSuffix;
      systemMastery = recomputed.systemMastery;
      topicStatus = recomputed.topicStatus;
    }

    const persisted = await this.sessionRepo.editSessionAndReplaceTopicSuffix({
      userId: input.userId,
      sessionId: input.sessionId,
      topicId: existingSession.topicId,
      anchorReviewNumber,
      session: sessionEditInput,
      reviews: recomputedReviews,
    });

    if (!persisted) {
      throw new EntityNotFoundError('Session', input.sessionId);
    }

    if (affectsReviewChain) {
      await this.topicRepo.updateMastery(existingSession.topicId, systemMastery, topicStatus);
    }

    return {
      sessionId: existingSession.id,
      topicId: existingSession.topicId,
      anchorReviewNumber,
      recomputedReviewCount: recomputedReviews.length,
      systemMastery,
      topicStatus,
    };
  }

  private buildEditedSessionTimeline(
    sessions: StudySession[],
    sessionId: string,
    edit: SessionEditInput,
  ): StudySession[] {
    const updated = sessions.map((session) => {
      if (session.id !== sessionId) {
        return session;
      }

      return StudySession.fromPersistence({
        id: session.id,
        userId: session.userId,
        topicId: session.topicId,
        sessionType: session.sessionType,
        durationMinutes: edit.durationMinutes,
        qualityRating: edit.qualityRating,
        notes: session.notes,
        studiedAt: edit.studiedAt,
        createdAt: session.createdAt,
      });
    });

    return updated.sort((a, b) => {
      const studiedDiff = a.studiedAt.getTime() - b.studiedAt.getTime();
      if (studiedDiff !== 0) {
        return studiedDiff;
      }

      const createdDiff = a.createdAt.getTime() - b.createdAt.getTime();
      if (createdDiff !== 0) {
        return createdDiff;
      }

      return a.id.localeCompare(b.id);
    });
  }

  private resolveAnchorForReviewSession(sessions: StudySession[], sessionId: string): number {
    let reviewCount = 0;

    for (const session of sessions) {
      if (session.sessionType.value === 'review') {
        reviewCount += 1;
      }

      if (session.id === sessionId) {
        return Math.max(1, reviewCount);
      }
    }

    throw new EntityNotFoundError('Session', sessionId);
  }

  private getMaxReviewNumber(reviews: Array<{ reviewNumber: number }>): number {
    if (reviews.length === 0) {
      return 0;
    }

    return reviews.reduce((max, review) => Math.max(max, review.reviewNumber), 0);
  }

  private calculateCurrentMastery(reviews: Array<{ status: { isCompleted: boolean }; result: ReviewResult | null; intervalDays: number; completedDate: Date | null }>): number {
    const completed = reviews
      .filter((review) => review.status.isCompleted && review.result && review.completedDate)
      .map((review) => ({
        result: review.result as ReviewResult,
        intervalDays: review.intervalDays,
        completedDate: review.completedDate as Date,
      }));

    if (completed.length === 0) {
      return 0;
    }

    return this.spacedRepetition.calculateSystemMastery(completed);
  }

  private mapQualityToResult(qualityRating: number | null): ReviewResult {
    if (qualityRating === null || qualityRating === undefined) {
      return ReviewResult.GOOD;
    }

    switch (qualityRating) {
      case 5:
        return ReviewResult.PERFECT;
      case 4:
        return ReviewResult.GOOD;
      case 3:
        return ReviewResult.REGULAR;
      default:
        return ReviewResult.BAD;
    }
  }
}
