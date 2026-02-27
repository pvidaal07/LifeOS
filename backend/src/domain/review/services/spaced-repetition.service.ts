import { ReviewResult } from '../value-objects/review-result.vo';
import { ReviewSettings } from '../entities/review-settings.entity';

export interface CompletedReviewData {
  result: ReviewResult;
  intervalDays: number;
  completedDate: Date;
}

export class SpacedRepetitionService {
  /**
   * Calculate the next review interval in days based on the review result
   * and the user's review settings.
   *
   * Algorithm:
   * - bad + badReset → reset to baseIntervals[0] (typically 1 day)
   * - bad + !badReset → halve the interval: max(1, round(interval / 2))
   * - perfect/good/regular → round(interval * multiplier)
   * - Cap at 365 days maximum
   */
  calculateNextInterval(
    currentIntervalDays: number,
    result: ReviewResult,
    settings: ReviewSettings,
  ): number {
    let nextInterval: number;

    if (result.isBad) {
      if (settings.badReset) {
        nextInterval = settings.getFirstInterval();
      } else {
        nextInterval = Math.max(1, Math.round(currentIntervalDays / 2));
      }
    } else {
      const multiplier = settings.getMultiplierForResult(result.value);
      nextInterval = Math.round(currentIntervalDays * multiplier);
    }

    // Cap at 365 days
    return Math.min(nextInterval, 365);
  }

  /**
   * Calculate the next review date by adding intervalDays to the completion date.
   */
  calculateNextReviewDate(completedAt: Date, intervalDays: number): Date {
    const next = new Date(completedAt);
    next.setDate(next.getDate() + intervalDays);
    return next;
  }

  /**
   * Calculate urgency score for a pending review.
   *
   * Formula: ((daysOverdue + 1) / max(1, intervalDays)) * (11 - masteryLevel)
   * - Higher score = more urgent
   * - Reviews that are more overdue relative to their interval are more urgent
   * - Topics with lower mastery are more urgent
   */
  calculateUrgencyScore(
    scheduledDate: Date,
    intervalDays: number,
    masteryLevel: number,
    now: Date = new Date(),
  ): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysOverdue = Math.max(
      0,
      Math.floor((now.getTime() - scheduledDate.getTime()) / msPerDay),
    );
    const effectiveMastery = masteryLevel || 1;

    return (
      ((daysOverdue + 1) / Math.max(1, intervalDays)) * (11 - effectiveMastery)
    );
  }

  /**
   * Calculate system mastery level for a topic based on its completed reviews.
   *
   * Formula:
   * - successRatio = successfulReviews / totalReviews
   * - intervalFactor = log2(lastReview.intervalDays + 1) / 3
   * - mastery = min(10, successRatio * 10 * intervalFactor)
   * - Rounded to 1 decimal place
   *
   * Returns 0 if no completed reviews.
   */
  calculateSystemMastery(completedReviews: CompletedReviewData[]): number {
    if (completedReviews.length === 0) return 0;

    const totalReviews = completedReviews.length;
    const successfulReviews = completedReviews.filter(
      (r) => r.result.isSuccessful,
    ).length;

    const lastReview = completedReviews[completedReviews.length - 1];
    const intervalFactor = Math.log2(lastReview.intervalDays + 1) / 3;

    const mastery = Math.min(
      10,
      (successfulReviews / totalReviews) * 10 * intervalFactor,
    );

    return Math.round(mastery * 10) / 10;
  }

  /**
   * Determine the topic status based on system mastery level.
   * mastery >= 8 → 'mastered', otherwise → 'in_progress'
   */
  determineTopicStatus(systemMastery: number): 'mastered' | 'in_progress' {
    return systemMastery >= 8 ? 'mastered' : 'in_progress';
  }

  /**
   * Get default review settings values.
   */
  getDefaultIntervals(): number[] {
    return [1, 7, 30, 90];
  }
}
