import { ReviewSchedule as PrismaReviewSchedule } from '@prisma/client';
import { ReviewSchedule } from '../../../domain/review/entities/review-schedule.entity';
import { ReviewStatus } from '../../../domain/review/value-objects/review-status.vo';
import { ReviewResult } from '../../../domain/review/value-objects/review-result.vo';

export class ReviewScheduleMapper {
  static toDomain(prisma: PrismaReviewSchedule): ReviewSchedule {
    return ReviewSchedule.fromPersistence({
      id: prisma.id,
      userId: prisma.userId,
      topicId: prisma.topicId,
      scheduledDate: prisma.scheduledDate,
      completedDate: prisma.completedDate,
      status: ReviewStatus.create(prisma.status),
      result: prisma.result ? ReviewResult.create(prisma.result) : null,
      urgencyScore: prisma.urgencyScore,
      intervalDays: prisma.intervalDays,
      reviewNumber: prisma.reviewNumber,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    });
  }

  static toPersistence(domain: ReviewSchedule): {
    id: string;
    userId: string;
    topicId: string;
    scheduledDate: Date;
    completedDate: Date | null;
    status: string;
    result: string | null;
    urgencyScore: number;
    intervalDays: number;
    reviewNumber: number;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: domain.id,
      userId: domain.userId,
      topicId: domain.topicId,
      scheduledDate: domain.scheduledDate,
      completedDate: domain.completedDate,
      status: domain.status.value,
      result: domain.result ? domain.result.value : null,
      urgencyScore: domain.urgencyScore,
      intervalDays: domain.intervalDays,
      reviewNumber: domain.reviewNumber,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
