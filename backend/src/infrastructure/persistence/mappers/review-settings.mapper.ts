import { ReviewSettings as PrismaReviewSettings } from '@prisma/client';
import { ReviewSettings } from '../../../domain/review/entities/review-settings.entity';

export class ReviewSettingsMapper {
  static toDomain(prisma: PrismaReviewSettings): ReviewSettings {
    return ReviewSettings.fromPersistence({
      id: prisma.id,
      userId: prisma.userId,
      baseIntervals: prisma.baseIntervals as number[],
      perfectMultiplier: prisma.perfectMultiplier,
      goodMultiplier: prisma.goodMultiplier,
      regularMultiplier: prisma.regularMultiplier,
      badReset: prisma.badReset,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    });
  }

  static toPersistence(domain: ReviewSettings): {
    id: string;
    userId: string;
    baseIntervals: number[];
    perfectMultiplier: number;
    goodMultiplier: number;
    regularMultiplier: number;
    badReset: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: domain.id,
      userId: domain.userId,
      baseIntervals: [...domain.baseIntervals],
      perfectMultiplier: domain.perfectMultiplier,
      goodMultiplier: domain.goodMultiplier,
      regularMultiplier: domain.regularMultiplier,
      badReset: domain.badReset,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
