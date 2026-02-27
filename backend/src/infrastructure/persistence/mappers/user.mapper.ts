import { User as PrismaUser } from '@prisma/client';
import { User } from '../../../domain/user/entities/user.entity';

export class UserMapper {
  static toDomain(prisma: PrismaUser): User {
    return User.fromPersistence({
      id: prisma.id,
      email: prisma.email,
      passwordHash: prisma.passwordHash,
      name: prisma.name,
      avatarUrl: prisma.avatarUrl,
      isActive: prisma.isActive,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    });
  }

  static toPersistence(domain: User): {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    avatarUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: domain.id,
      email: domain.email,
      passwordHash: domain.passwordHash,
      name: domain.name,
      avatarUrl: domain.avatarUrl,
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
