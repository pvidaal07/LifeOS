import { UserSettings as PrismaUserSettings } from '@prisma/client';
import { UserSettings } from '../../../domain/user/entities/user-settings.entity';

export class UserSettingsMapper {
  static toDomain(prisma: PrismaUserSettings): UserSettings {
    return UserSettings.fromPersistence({
      id: prisma.id,
      userId: prisma.userId,
      timezone: prisma.timezone,
      theme: prisma.theme,
      locale: prisma.locale,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    });
  }

  static toPersistence(domain: UserSettings): {
    id: string;
    userId: string;
    timezone: string;
    theme: string;
    locale: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: domain.id,
      userId: domain.userId,
      timezone: domain.timezone,
      theme: domain.theme,
      locale: domain.locale,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
