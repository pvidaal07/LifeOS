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
}
