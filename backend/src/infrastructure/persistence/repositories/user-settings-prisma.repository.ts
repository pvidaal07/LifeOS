import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserSettingsMapper } from '../mappers/user-settings.mapper';
import { UserSettingsRepositoryPort } from '../../../application/ports/user-repository.port';
import { UserSettings } from '../../../domain/user';

@Injectable()
export class UserSettingsPrismaRepository
  implements UserSettingsRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<UserSettings | null> {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    return settings ? UserSettingsMapper.toDomain(settings) : null;
  }

  async upsert(settings: UserSettings): Promise<UserSettings> {
    const data = UserSettingsMapper.toPersistence(settings);

    const result = await this.prisma.userSettings.upsert({
      where: { userId: data.userId },
      update: {
        timezone: data.timezone,
        theme: data.theme,
        locale: data.locale,
        updatedAt: data.updatedAt,
      },
      create: data,
    });

    return UserSettingsMapper.toDomain(result);
  }
}
