import {
  ReviewResult,
  ReviewSchedule,
  ReviewSettings,
  ReviewStatus,
} from '../../../src/domain/review';
import { RecomputeTopicReviewChainService } from '../../../src/application/use-cases/reviews/recompute-topic-review-chain.service';

function buildCompletedReview(params: {
  id: string;
  reviewNumber: number;
  intervalDays: number;
  scheduledDate: string;
  completedDate: string;
  result: 'perfect' | 'good' | 'regular' | 'bad';
}): ReviewSchedule {
  return ReviewSchedule.fromPersistence({
    id: params.id,
    userId: 'user-1',
    topicId: 'topic-1',
    scheduledDate: new Date(params.scheduledDate),
    completedDate: new Date(params.completedDate),
    status: ReviewStatus.COMPLETED,
    result: ReviewResult.create(params.result),
    urgencyScore: 0,
    intervalDays: params.intervalDays,
    reviewNumber: params.reviewNumber,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

function buildPendingReview(params: {
  id: string;
  reviewNumber: number;
  intervalDays: number;
  scheduledDate: string;
}): ReviewSchedule {
  return ReviewSchedule.fromPersistence({
    id: params.id,
    userId: 'user-1',
    topicId: 'topic-1',
    scheduledDate: new Date(params.scheduledDate),
    completedDate: null,
    status: ReviewStatus.PENDING,
    result: null,
    urgencyScore: 0,
    intervalDays: params.intervalDays,
    reviewNumber: params.reviewNumber,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}

describe('RecomputeTopicReviewChainService', () => {
  const service = new RecomputeTopicReviewChainService();

  const settings = ReviewSettings.createDefault('settings-1', 'user-1');

  const timeline = [
    buildCompletedReview({
      id: 'review-1',
      reviewNumber: 1,
      intervalDays: 1,
      scheduledDate: '2026-01-02T00:00:00.000Z',
      completedDate: '2026-01-02T00:00:00.000Z',
      result: 'good',
    }),
    buildCompletedReview({
      id: 'review-2',
      reviewNumber: 2,
      intervalDays: 2,
      scheduledDate: '2026-01-04T00:00:00.000Z',
      completedDate: '2026-01-04T00:00:00.000Z',
      result: 'good',
    }),
    buildPendingReview({
      id: 'review-3',
      reviewNumber: 3,
      intervalDays: 4,
      scheduledDate: '2026-01-08T00:00:00.000Z',
    }),
  ];

  it('recomputes mastery/topic status and keeps output deterministic', () => {
    const input = {
      userId: 'user-1',
      topicId: 'topic-1',
      anchorReviewNumber: 1,
      reviewTimeline: timeline,
      reviewSettings: settings,
      referenceDate: new Date('2026-01-10T00:00:00.000Z'),
      firstReviewAnchorDate: new Date('2026-01-01T00:00:00.000Z'),
      overrides: [
        {
          reviewNumber: 1,
          completedDate: new Date('2026-01-01T00:00:00.000Z'),
          result: ReviewResult.BAD,
        },
      ],
    };

    const firstRun = service.execute(input);
    const secondRun = service.execute(input);

    expect(firstRun.systemMastery).toBe(3.3);
    expect(firstRun.topicStatus).toBe('in_progress');

    expect(firstRun.recomputedSuffix.map((r) => r.toJSON())).toEqual(
      secondRun.recomputedSuffix.map((r) => r.toJSON()),
    );
    expect(firstRun.systemMastery).toBe(secondRun.systemMastery);
    expect(firstRun.topicStatus).toBe(secondRun.topicStatus);
  });

  it('recomputes pending review as due with deterministic urgency', () => {
    const result = service.execute({
      userId: 'user-1',
      topicId: 'topic-1',
      anchorReviewNumber: 1,
      reviewTimeline: timeline,
      reviewSettings: settings,
      referenceDate: new Date('2026-01-10T00:00:00.000Z'),
      firstReviewAnchorDate: new Date('2026-01-01T00:00:00.000Z'),
      overrides: [
        {
          reviewNumber: 1,
          completedDate: new Date('2026-01-01T00:00:00.000Z'),
          result: ReviewResult.BAD,
        },
      ],
    });

    const pending = result.recomputedSuffix.find((review) => review.status.isPending);
    expect(pending).toBeDefined();
    expect(pending!.scheduledDate.toISOString()).toBe('2026-01-06T00:00:00.000Z');
    expect(pending!.scheduledDate.getTime()).toBeLessThan(new Date('2026-01-10T00:00:00.000Z').getTime());
    expect(pending!.urgencyScore).toBeCloseTo(19.25, 2);
  });

  it('recomputes pending review as upcoming with deterministic urgency', () => {
    const result = service.execute({
      userId: 'user-1',
      topicId: 'topic-1',
      anchorReviewNumber: 1,
      reviewTimeline: timeline,
      reviewSettings: settings,
      referenceDate: new Date('2026-01-03T00:00:00.000Z'),
      firstReviewAnchorDate: new Date('2026-01-01T00:00:00.000Z'),
      overrides: [
        {
          reviewNumber: 1,
          completedDate: new Date('2026-01-01T00:00:00.000Z'),
          result: ReviewResult.BAD,
        },
      ],
    });

    const pending = result.recomputedSuffix.find((review) => review.status.isPending);
    expect(pending).toBeDefined();
    expect(pending!.scheduledDate.toISOString()).toBe('2026-01-06T00:00:00.000Z');
    expect(pending!.scheduledDate.getTime()).toBeGreaterThan(new Date('2026-01-03T00:00:00.000Z').getTime());
    expect(pending!.urgencyScore).toBeCloseTo(3.85, 2);
  });
});
