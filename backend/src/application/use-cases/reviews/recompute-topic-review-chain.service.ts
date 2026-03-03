import {
  ReviewResult,
  ReviewSchedule,
  ReviewSettings,
  ReviewStatus,
  SpacedRepetitionService,
} from '../../../domain/review';

export interface RecomputeReviewOverride {
  reviewNumber: number;
  completedDate: Date;
  result: ReviewResult;
}

export interface RecomputeTopicReviewChainInput {
  userId: string;
  topicId: string;
  anchorReviewNumber: number;
  reviewTimeline: ReviewSchedule[];
  reviewSettings: ReviewSettings;
  referenceDate: Date;
  firstReviewAnchorDate?: Date;
  overrides?: RecomputeReviewOverride[];
}

export interface RecomputeTopicReviewChainOutput {
  recomputedSuffix: ReviewSchedule[];
  systemMastery: number;
  topicStatus: 'mastered' | 'in_progress';
}

export class RecomputeTopicReviewChainService {
  private readonly spacedRepetition = new SpacedRepetitionService();

  execute(input: RecomputeTopicReviewChainInput): RecomputeTopicReviewChainOutput {
    const timeline = [...input.reviewTimeline].sort(
      (a, b) => a.reviewNumber - b.reviewNumber,
    );

    const existingByNumber = new Map<number, ReviewSchedule>();
    for (const review of timeline) {
      existingByNumber.set(review.reviewNumber, review);
    }

    const completedEvents = this.buildCompletedEvents(timeline, input.overrides ?? []);

    const recomputedByNumber = new Map<number, ReviewSchedule>();
    const recomputedSuffix: ReviewSchedule[] = [];

    const maxCompletedNumber = completedEvents.length > 0
      ? completedEvents[completedEvents.length - 1].reviewNumber
      : 0;

    for (const event of completedEvents) {
      if (event.reviewNumber < input.anchorReviewNumber) {
        continue;
      }

      const scheduleData = this.resolveCompletedScheduleData(
        event.reviewNumber,
        existingByNumber,
        recomputedByNumber,
        input.reviewSettings,
        input.firstReviewAnchorDate,
      );

      const existing = existingByNumber.get(event.reviewNumber);
      const completedReview = ReviewSchedule.fromPersistence({
        id: existing?.id ?? crypto.randomUUID(),
        userId: input.userId,
        topicId: input.topicId,
        scheduledDate: scheduleData.scheduledDate,
        completedDate: event.completedDate,
        status: ReviewStatus.COMPLETED,
        result: event.result,
        urgencyScore: 0,
        intervalDays: scheduleData.intervalDays,
        reviewNumber: event.reviewNumber,
        createdAt: existing?.createdAt ?? input.referenceDate,
        updatedAt: input.referenceDate,
      });

      recomputedByNumber.set(event.reviewNumber, completedReview);
      recomputedSuffix.push(completedReview);
    }

    const masterySource = this.buildMasterySource(
      timeline,
      recomputedByNumber,
      input.anchorReviewNumber,
    );
    const systemMastery = this.spacedRepetition.calculateSystemMastery(masterySource);
    const topicStatus = this.spacedRepetition.determineTopicStatus(systemMastery);

    const pendingReview = this.buildPendingReview({
      input,
      existingByNumber,
      recomputedByNumber,
      maxCompletedNumber,
      systemMastery,
    });

    if (pendingReview.reviewNumber >= input.anchorReviewNumber) {
      recomputedSuffix.push(pendingReview);
    }

    return {
      recomputedSuffix,
      systemMastery,
      topicStatus,
    };
  }

  private buildCompletedEvents(
    timeline: ReviewSchedule[],
    overrides: RecomputeReviewOverride[],
  ): Array<{ reviewNumber: number; completedDate: Date; result: ReviewResult }> {
    const byNumber = new Map<number, { reviewNumber: number; completedDate: Date; result: ReviewResult }>();

    for (const review of timeline) {
      if (!review.status.isCompleted || !review.completedDate || !review.result) {
        continue;
      }

      byNumber.set(review.reviewNumber, {
        reviewNumber: review.reviewNumber,
        completedDate: review.completedDate,
        result: review.result,
      });
    }

    for (const override of overrides) {
      byNumber.set(override.reviewNumber, {
        reviewNumber: override.reviewNumber,
        completedDate: override.completedDate,
        result: override.result,
      });
    }

    return [...byNumber.values()].sort((a, b) => a.reviewNumber - b.reviewNumber);
  }

  private resolveCompletedScheduleData(
    reviewNumber: number,
    existingByNumber: Map<number, ReviewSchedule>,
    recomputedByNumber: Map<number, ReviewSchedule>,
    settings: ReviewSettings,
    firstReviewAnchorDate?: Date,
  ): { scheduledDate: Date; intervalDays: number } {
    if (reviewNumber === 1) {
      const firstInterval = settings.getFirstInterval();
      const scheduledDate = this.resolveFirstScheduledDate(
        existingByNumber.get(1),
        firstReviewAnchorDate,
        firstInterval,
      );

      return {
        scheduledDate,
        intervalDays: firstInterval,
      };
    }

    const previous = recomputedByNumber.get(reviewNumber - 1) ?? existingByNumber.get(reviewNumber - 1);
    if (!previous || !previous.completedDate || !previous.result) {
      throw new Error(`Cannot recompute review #${reviewNumber} without completed review #${reviewNumber - 1}`);
    }

    const intervalDays = this.spacedRepetition.calculateNextInterval(
      previous.intervalDays,
      previous.result,
      settings,
    );
    const baseDate = previous.scheduledDate > previous.completedDate
      ? previous.scheduledDate
      : previous.completedDate;

    return {
      intervalDays,
      scheduledDate: this.spacedRepetition.calculateNextReviewDate(baseDate, intervalDays),
    };
  }

  private resolveFirstScheduledDate(
    existingFirstReview: ReviewSchedule | undefined,
    firstReviewAnchorDate: Date | undefined,
    firstInterval: number,
  ): Date {
    if (firstReviewAnchorDate) {
      return this.spacedRepetition.calculateNextReviewDate(firstReviewAnchorDate, firstInterval);
    }

    if (existingFirstReview) {
      return existingFirstReview.scheduledDate;
    }

    return this.spacedRepetition.calculateNextReviewDate(new Date(0), firstInterval);
  }

  private buildMasterySource(
    timeline: ReviewSchedule[],
    recomputedByNumber: Map<number, ReviewSchedule>,
    anchorReviewNumber: number,
  ): Array<{ result: ReviewResult; intervalDays: number; completedDate: Date }> {
    const source: Array<{ result: ReviewResult; intervalDays: number; completedDate: Date }> = [];

    for (const review of timeline) {
      if (review.reviewNumber >= anchorReviewNumber) {
        continue;
      }

      if (!review.status.isCompleted || !review.result || !review.completedDate) {
        continue;
      }

      source.push({
        result: review.result,
        intervalDays: review.intervalDays,
        completedDate: review.completedDate,
      });
    }

    const recomputedCompleted = [...recomputedByNumber.values()]
      .filter((review) => review.status.isCompleted && review.result && review.completedDate)
      .sort((a, b) => a.reviewNumber - b.reviewNumber);

    for (const review of recomputedCompleted) {
      source.push({
        result: review.result!,
        intervalDays: review.intervalDays,
        completedDate: review.completedDate!,
      });
    }

    return source;
  }

  private buildPendingReview(params: {
    input: RecomputeTopicReviewChainInput;
    existingByNumber: Map<number, ReviewSchedule>;
    recomputedByNumber: Map<number, ReviewSchedule>;
    maxCompletedNumber: number;
    systemMastery: number;
  }): ReviewSchedule {
    const { input, existingByNumber, recomputedByNumber, maxCompletedNumber, systemMastery } = params;
    const pendingReviewNumber = maxCompletedNumber + 1;
    const existingPending = existingByNumber.get(pendingReviewNumber);

    let intervalDays: number;
    let scheduledDate: Date;

    if (maxCompletedNumber === 0) {
      intervalDays = input.reviewSettings.getFirstInterval();
      scheduledDate = this.resolveFirstScheduledDate(
        existingByNumber.get(1),
        input.firstReviewAnchorDate,
        intervalDays,
      );
    } else {
      const previous = recomputedByNumber.get(maxCompletedNumber) ?? existingByNumber.get(maxCompletedNumber);
      if (!previous || !previous.completedDate || !previous.result) {
        throw new Error(`Cannot build pending review without completed review #${maxCompletedNumber}`);
      }

      intervalDays = this.spacedRepetition.calculateNextInterval(
        previous.intervalDays,
        previous.result,
        input.reviewSettings,
      );

      const baseDate = previous.scheduledDate > previous.completedDate
        ? previous.scheduledDate
        : previous.completedDate;
      scheduledDate = this.spacedRepetition.calculateNextReviewDate(baseDate, intervalDays);
    }

    const urgencyScore = this.spacedRepetition.calculateUrgencyScore(
      scheduledDate,
      intervalDays,
      systemMastery,
      input.referenceDate,
    );

    return ReviewSchedule.fromPersistence({
      id: existingPending?.id ?? crypto.randomUUID(),
      userId: input.userId,
      topicId: input.topicId,
      scheduledDate,
      completedDate: null,
      status: ReviewStatus.PENDING,
      result: null,
      urgencyScore,
      intervalDays,
      reviewNumber: pendingReviewNumber,
      createdAt: existingPending?.createdAt ?? input.referenceDate,
      updatedAt: input.referenceDate,
    });
  }
}
