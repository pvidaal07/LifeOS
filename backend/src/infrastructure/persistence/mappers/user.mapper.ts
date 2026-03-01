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
      emailVerified: prisma.emailVerified,
      verificationCodeHash: prisma.verificationCodeHash,
      verificationCodeExpiresAt: prisma.verificationCodeExpiresAt,
      verificationAttempts: prisma.verificationAttempts,
      verificationLastSentAt: prisma.verificationLastSentAt,
      verificationResendCount: prisma.verificationResendCount,
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
    emailVerified: boolean;
    verificationCodeHash: string | null;
    verificationCodeExpiresAt: Date | null;
    verificationAttempts: number;
    verificationLastSentAt: Date | null;
    verificationResendCount: number;
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
      emailVerified: domain.emailVerified,
      verificationCodeHash: domain.verificationCodeHash,
      verificationCodeExpiresAt: domain.verificationCodeExpiresAt,
      verificationAttempts: domain.verificationAttempts,
      verificationLastSentAt: domain.verificationLastSentAt,
      verificationResendCount: domain.verificationResendCount,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }
}
