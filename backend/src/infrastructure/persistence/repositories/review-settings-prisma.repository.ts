import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewSettingsMapper } from '../mappers/review-settings.mapper';
import { ReviewSettingsRepositoryPort } from '../../../application/ports/review-settings-repository.port';
import { ReviewSettings } from '../../../domain/review';

@Injectable()
export class ReviewSettingsPrismaRepository
  implements ReviewSettingsRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<ReviewSettings | null> {
    const settings = await this.prisma.reviewSettings.findUnique({
      where: { userId },
    });

    return settings ? ReviewSettingsMapper.toDomain(settings) : null;
  }

  async upsert(settings: ReviewSettings): Promise<ReviewSettings> {
    const data = ReviewSettingsMapper.toPersistence(settings);

    const result = await this.prisma.reviewSettings.upsert({
      where: { userId: data.userId },
      update: {
        baseIntervals: data.baseIntervals,
        perfectMultiplier: data.perfectMultiplier,
        goodMultiplier: data.goodMultiplier,
        regularMultiplier: data.regularMultiplier,
        badReset: data.badReset,
        updatedAt: data.updatedAt,
      },
      create: data,
    });

    return ReviewSettingsMapper.toDomain(result);
  }
}
