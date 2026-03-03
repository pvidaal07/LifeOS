import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewScheduleMapper } from '../mappers/review-schedule.mapper';
import {
  ReviewRepositoryPort,
  ReviewScheduleWithTopic,
  CompletedReviewData,
  ReviewScheduleForUrgency,
  ReviewTopicSuffixWriteParams,
  ReviewEditAndSuffixRecomputeParams,
} from '../../../application/ports/review-repository.port';
import { ReviewSchedule } from '../../../domain/review';

@Injectable()
export class ReviewPrismaRepository implements ReviewRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch pending reviews (today + overdue), joined with topic/subject/plan info.
   * Ordered by urgencyScore DESC (most urgent first).
   * Matches the query pattern from ReviewsService.getPendingReviews().
   */
  async findPendingByUserId(
    userId: string,
    upToDate: Date,
  ): Promise<ReviewScheduleWithTopic[]> {
    const reviews = await this.prisma.reviewSchedule.findMany({
      where: {
        userId,
        status: 'pending',
        scheduledDate: { lte: upToDate },
      },
      include: {
        topic: {
          include: {
            subject: {
              include: {
                studyPlan: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { urgencyScore: 'desc' },
    });

    return reviews.map((review) => ({
      review: ReviewScheduleMapper.toDomain(review),
      topicName: review.topic.name,
      subjectName: review.topic.subject.name,
      subjectColor: review.topic.subject.color,
      planName: review.topic.subject.studyPlan.name,
    }));
  }

  /**
   * Fetch upcoming reviews (scheduled after today), joined with topic/subject/plan info.
   * These are reviews not yet due — visible in the "upcoming" section.
   * Ordered by scheduledDate ASC (soonest first).
   */
  async findUpcomingByUserId(
    userId: string,
    afterDate: Date,
    limit: number = 20,
  ): Promise<ReviewScheduleWithTopic[]> {
    const reviews = await this.prisma.reviewSchedule.findMany({
      where: {
        userId,
        status: 'pending',
        scheduledDate: { gt: afterDate },
      },
      include: {
        topic: {
          include: {
            subject: {
              include: {
                studyPlan: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
      take: limit,
    });

    return reviews.map((review) => ({
      review: ReviewScheduleMapper.toDomain(review),
      topicName: review.topic.name,
      subjectName: review.topic.subject.name,
      subjectColor: review.topic.subject.color,
      planName: review.topic.subject.studyPlan.name,
    }));
  }

  /**
   * Fetch a single pending review by ID, scoped to userId.
   * Used by completeReview / skipReview use-cases.
   */
  async findPendingById(
    id: string,
    userId: string,
  ): Promise<ReviewSchedule | null> {
    const review = await this.prisma.reviewSchedule.findFirst({
      where: { id, userId, status: 'pending' },
    });

    return review ? ReviewScheduleMapper.toDomain(review) : null;
  }

  async findByIdForOwner(id: string, userId: string): Promise<ReviewSchedule | null> {
    const review = await this.prisma.reviewSchedule.findFirst({
      where: { id, userId },
    });

    return review ? ReviewScheduleMapper.toDomain(review) : null;
  }

  /**
   * Fetch the most urgent pending review for a topic, scoped to userId.
   * Returns the review with the earliest scheduledDate (most overdue first).
   * Used by CreateSessionUseCase to auto-complete reviews when a study session
   * of type "review" is registered.
   */
  async findPendingByTopicId(
    topicId: string,
    userId: string,
  ): Promise<ReviewSchedule | null> {
    const review = await this.prisma.reviewSchedule.findFirst({
      where: { topicId, userId, status: 'pending' },
      orderBy: { scheduledDate: 'asc' },
    });

    return review ? ReviewScheduleMapper.toDomain(review) : null;
  }

  async findTimelineByTopicId(
    topicId: string,
    userId: string,
  ): Promise<ReviewSchedule[]> {
    const reviews = await this.prisma.reviewSchedule.findMany({
      where: { topicId, userId },
      orderBy: { reviewNumber: 'asc' },
    });

    return reviews.map(ReviewScheduleMapper.toDomain);
  }

  /**
   * Fetch completed reviews for a topic — used to calculate system mastery.
   * Returns only the fields needed for mastery computation.
   * Scoped to userId for data isolation.
   */
  async findCompletedByTopicId(
    topicId: string,
    userId: string,
  ): Promise<CompletedReviewData[]> {
    const reviews = await this.prisma.reviewSchedule.findMany({
      where: { topicId, userId, status: 'completed' },
      orderBy: { completedDate: 'asc' },
      select: {
        result: true,
        intervalDays: true,
        completedDate: true,
      },
    });

    return reviews.map((r) => ({
      result: r.result ?? 'regular',
      intervalDays: r.intervalDays,
      completedDate: r.completedDate!,
    }));
  }

  /**
   * Fetch ALL pending reviews for a user — used for urgency recalculation.
   * Includes topic.masteryLevel for the urgency formula.
   * Matches ReviewsService.recalculateUrgency() query.
   */
  async findAllPendingByUserId(
    userId: string,
  ): Promise<ReviewScheduleForUrgency[]> {
    const reviews = await this.prisma.reviewSchedule.findMany({
      where: { userId, status: 'pending' },
      include: { topic: true },
    });

    return reviews.map((review) => ({
      id: review.id,
      scheduledDate: review.scheduledDate,
      intervalDays: review.intervalDays,
      topicMasteryLevel: review.topic.masteryLevel ?? 1,
    }));
  }

  /**
   * Save a review schedule (create or update).
   * Uses upsert: creates if the ID doesn't exist, updates if it does.
   * This handles both new reviews (scheduleFirst, scheduleNext) and
   * updates to existing reviews (complete, skip).
   */
  async save(review: ReviewSchedule): Promise<void> {
    const data = ReviewScheduleMapper.toPersistence(review);

    await this.prisma.reviewSchedule.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        userId: data.userId,
        topicId: data.topicId,
        scheduledDate: data.scheduledDate,
        completedDate: data.completedDate,
        status: data.status,
        result: data.result,
        urgencyScore: data.urgencyScore,
        intervalDays: data.intervalDays,
        reviewNumber: data.reviewNumber,
      },
      update: {
        scheduledDate: data.scheduledDate,
        completedDate: data.completedDate,
        status: data.status,
        result: data.result,
        urgencyScore: data.urgencyScore,
        intervalDays: data.intervalDays,
        reviewNumber: data.reviewNumber,
        updatedAt: data.updatedAt,
      },
    });
  }

  /**
   * Bulk update urgency scores for pending reviews.
   * Matches the $transaction pattern from ReviewsService.recalculateUrgency().
   */
  async updateMany(
    reviews: { id: string; urgencyScore: number }[],
  ): Promise<void> {
    const updates = reviews.map((review) =>
      this.prisma.reviewSchedule.update({
        where: { id: review.id },
        data: { urgencyScore: review.urgencyScore },
      }),
    );

    await this.prisma.$transaction(updates);
  }

  async replaceTopicSuffix(params: ReviewTopicSuffixWriteParams): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.reviewSchedule.deleteMany({
        where: {
          userId: params.userId,
          topicId: params.topicId,
          reviewNumber: { gte: params.anchorReviewNumber },
        },
      });

      if (params.reviews.length === 0) {
        return;
      }

      await tx.reviewSchedule.createMany({
        data: params.reviews.map((review) => ReviewScheduleMapper.toPersistence(review)),
      });
    });
  }

  async editReviewAndReplaceTopicSuffix(
    params: ReviewEditAndSuffixRecomputeParams,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.reviewSchedule.findFirst({
        where: {
          id: params.reviewId,
          userId: params.userId,
          topicId: params.topicId,
        },
        select: { id: true },
      });

      if (!review) {
        return false;
      }

      if (params.studySessionPatch) {
        const studySession = await tx.studySession.findFirst({
          where: {
            userId: params.userId,
            topicId: params.topicId,
            sessionType: 'review',
            studiedAt: params.studySessionPatch.matchStudiedAt,
          },
          select: { id: true },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        });

        if (studySession) {
          const sessionData: {
            studiedAt?: Date;
            durationMinutes?: number;
            qualityRating?: number;
          } = {};

          if (params.studySessionPatch.studiedAt !== undefined) {
            sessionData.studiedAt = params.studySessionPatch.studiedAt;
          }

          if (params.studySessionPatch.durationMinutes !== undefined) {
            sessionData.durationMinutes = params.studySessionPatch.durationMinutes;
          }

          if (params.studySessionPatch.qualityRating !== undefined) {
            sessionData.qualityRating = params.studySessionPatch.qualityRating;
          }

          if (Object.keys(sessionData).length > 0) {
            await tx.studySession.update({
              where: { id: studySession.id },
              data: sessionData,
            });
          }
        }
      }

      await tx.reviewSchedule.deleteMany({
        where: {
          userId: params.userId,
          topicId: params.topicId,
          reviewNumber: { gte: params.anchorReviewNumber },
        },
      });

      if (params.reviews.length > 0) {
        await tx.reviewSchedule.createMany({
          data: params.reviews.map((item) => ReviewScheduleMapper.toPersistence(item)),
        });
      }

      return true;
    });
  }
}
