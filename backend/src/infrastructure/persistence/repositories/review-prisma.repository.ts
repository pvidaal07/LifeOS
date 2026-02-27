import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewScheduleMapper } from '../mappers/review-schedule.mapper';
import {
  ReviewRepositoryPort,
  ReviewScheduleWithTopic,
  CompletedReviewData,
  ReviewScheduleForUrgency,
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

  /**
   * Fetch completed reviews for a topic — used to calculate system mastery.
   * Returns only the fields needed for mastery computation.
   */
  async findCompletedByTopicId(
    topicId: string,
  ): Promise<CompletedReviewData[]> {
    const reviews = await this.prisma.reviewSchedule.findMany({
      where: { topicId, status: 'completed' },
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
   * Create a new review schedule.
   * Used by scheduleFirstReview, completeReview (schedule next), skipReview.
   */
  async save(review: ReviewSchedule): Promise<void> {
    const data = ReviewScheduleMapper.toPersistence(review);

    await this.prisma.reviewSchedule.create({
      data: {
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
}
