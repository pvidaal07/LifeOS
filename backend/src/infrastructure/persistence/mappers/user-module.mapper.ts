import { UserModule as PrismaUserModule } from '@prisma/client';
import { UserModule } from '../../../domain/user/entities/user-module.entity';

export class UserModuleMapper {
  static toDomain(prisma: PrismaUserModule): UserModule {
    return UserModule.fromPersistence({
      id: prisma.id,
      userId: prisma.userId,
      moduleKey: prisma.moduleKey,
      isActive: prisma.isActive,
      displayOrder: prisma.displayOrder,
      createdAt: prisma.createdAt,
    });
  }

  static toPersistence(domain: UserModule): {
    id: string;
    userId: string;
    moduleKey: string;
    isActive: boolean;
    displayOrder: number;
    createdAt: Date;
  } {
    return {
      id: domain.id,
      userId: domain.userId,
      moduleKey: domain.moduleKey,
      isActive: domain.isActive,
      displayOrder: domain.displayOrder,
      createdAt: domain.createdAt,
    };
  }
}
