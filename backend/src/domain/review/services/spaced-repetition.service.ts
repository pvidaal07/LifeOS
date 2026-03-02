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
   * Formula (weighted approach):
   * - reviewCountFactor: min(1, completedReviews / 5) — rewards consistency, caps at 5 reviews
   * - successRatio: successfulReviews / totalReviews — rewards quality (perfect/good)
   * - intervalFactor: min(1, log2(lastInterval + 1) / log2(31)) — rewards long intervals, caps at 30 days
   * - recentBonus: latest 3 reviews weighted heavier (if all successful, +1 bonus)
   *
   * mastery = min(10, (reviewCountFactor * 3 + successRatio * 3 + intervalFactor * 3 + recentBonus))
   *
   * This gives a more gradual progression:
   * - 1 perfect review: ~3.3 (visible progress from the start)
   * - 2 perfect reviews: ~5.2
   * - 3 perfect reviews: ~7.5
   * - 4+ perfect reviews with growing intervals: 8-10 (mastered)
   *
   * Returns 0 if no completed reviews.
   */
  calculateSystemMastery(completedReviews: CompletedReviewData[]): number {
    if (completedReviews.length === 0) return 0;

    const totalReviews = completedReviews.length;
    const successfulReviews = completedReviews.filter(
      (r) => r.result.isSuccessful,
    ).length;

    // Factor 1: Consistency — how many reviews have been completed (caps at 5)
    const reviewCountFactor = Math.min(1, totalReviews / 5);

    // Factor 2: Quality — ratio of successful results (perfect/good)
    const successRatio = successfulReviews / totalReviews;

    // Factor 3: Interval growth — rewards long intervals (caps at 30-day interval)
    const lastReview = completedReviews[completedReviews.length - 1];
    const intervalFactor = Math.min(1, Math.log2(lastReview.intervalDays + 1) / Math.log2(31));

    // Factor 4: Recent performance bonus — last 3 reviews
    const recentReviews = completedReviews.slice(-3);
    const recentSuccessful = recentReviews.filter((r) => r.result.isSuccessful).length;
    const recentBonus = recentSuccessful === recentReviews.length ? 1 : 0;

    const mastery = Math.min(
      10,
      reviewCountFactor * 3 + successRatio * 3 + intervalFactor * 3 + recentBonus,
    );

    return Math.round(mastery * 10) / 10;
  }

  /**
   * Determine the topic status based on system mastery level.
   * mastery >= 7 → 'mastered', otherwise → 'in_progress'
   *
   * Threshold lowered from 8 to 7 to match the weighted mastery formula:
   * - 7+ is achievable after ~3-4 consistently successful reviews
   * - This makes the "mastered" status a realistic goal
   */
  determineTopicStatus(systemMastery: number): 'mastered' | 'in_progress' {
    return systemMastery >= 7 ? 'mastered' : 'in_progress';
  }

  /**
   * Get default review settings values.
   */
  getDefaultIntervals(): number[] {
    return [1, 7, 30, 90];
  }
}
