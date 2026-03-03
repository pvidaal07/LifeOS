import { describe, expect, it, vi } from 'vitest';
import { ReviewPrismaRepository } from '../../../../src/infrastructure/persistence/repositories/review-prisma.repository';
import {
  ReviewResult,
  ReviewSchedule,
  ReviewStatus,
} from '../../../../src/domain/review';

function buildReview(reviewNumber: number): ReviewSchedule {
  const now = new Date('2026-03-03T00:00:00.000Z');

  return ReviewSchedule.fromPersistence({
    id: `review-${reviewNumber}`,
    userId: 'user-1',
    topicId: 'topic-1',
    scheduledDate: now,
    completedDate: now,
    status: ReviewStatus.COMPLETED,
    result: ReviewResult.create('good'),
    urgencyScore: 0,
    intervalDays: 7,
    reviewNumber,
    createdAt: now,
    updatedAt: now,
  });
}

describe('ReviewPrismaRepository edit + recompute transaction', () => {
  it('returns false when review does not belong to user', async () => {
    const tx = {
      studySession: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      reviewSchedule: {
        findFirst: vi.fn().mockResolvedValue(null),
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
    };

    const prisma = {
      reviewSchedule: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<boolean>) => callback(tx)),
    };

    const repository = new ReviewPrismaRepository(prisma as never);
    const result = await repository.editReviewAndReplaceTopicSuffix({
      userId: 'user-1',
      reviewId: 'review-1',
      topicId: 'topic-1',
      anchorReviewNumber: 1,
      reviews: [buildReview(1)],
      studySessionPatch: {
        matchStudiedAt: new Date('2026-03-03T00:00:00.000Z'),
        durationMinutes: 30,
      },
    });

    expect(result).toBe(false);
    expect(tx.reviewSchedule.findFirst).toHaveBeenCalledWith({
      where: { id: 'review-1', userId: 'user-1', topicId: 'topic-1' },
      select: { id: true },
    });
    expect(tx.reviewSchedule.deleteMany).not.toHaveBeenCalled();
    expect(tx.reviewSchedule.createMany).not.toHaveBeenCalled();
    expect(tx.studySession.findFirst).not.toHaveBeenCalled();
  });

  it('updates suffix atomically for owned review', async () => {
    const tx = {
      studySession: {
        findFirst: vi.fn().mockResolvedValue({ id: 'session-1' }),
        update: vi.fn().mockResolvedValue({ id: 'session-1' }),
      },
      reviewSchedule: {
        findFirst: vi.fn().mockResolvedValue({ id: 'review-1' }),
        deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };

    const prisma = {
      reviewSchedule: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<boolean>) => callback(tx)),
    };

    const repository = new ReviewPrismaRepository(prisma as never);
    const reviews = [buildReview(1), buildReview(2)];

    const result = await repository.editReviewAndReplaceTopicSuffix({
      userId: 'user-1',
      reviewId: 'review-1',
      topicId: 'topic-1',
      anchorReviewNumber: 1,
      reviews,
      studySessionPatch: {
        matchStudiedAt: new Date('2026-03-03T00:00:00.000Z'),
        studiedAt: new Date('2026-03-02T00:00:00.000Z'),
        durationMinutes: 90,
        qualityRating: 4,
      },
    });

    expect(result).toBe(true);
    expect(tx.studySession.findFirst).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        topicId: 'topic-1',
        sessionType: 'review',
        studiedAt: new Date('2026-03-03T00:00:00.000Z'),
      },
      select: { id: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    expect(tx.studySession.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: {
        studiedAt: new Date('2026-03-02T00:00:00.000Z'),
        durationMinutes: 90,
        qualityRating: 4,
      },
    });
    expect(tx.reviewSchedule.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        topicId: 'topic-1',
        reviewNumber: { gte: 1 },
      },
    });
    expect(tx.reviewSchedule.createMany).toHaveBeenCalledTimes(1);
    expect(tx.reviewSchedule.createMany.mock.calls[0][0].data).toHaveLength(2);
  });
});
