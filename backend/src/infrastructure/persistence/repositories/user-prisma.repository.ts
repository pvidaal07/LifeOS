import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserMapper } from '../mappers/user.mapper';
import { UserSettingsMapper } from '../mappers/user-settings.mapper';
import { UserModuleMapper } from '../mappers/user-module.mapper';
import {
  UserRepositoryPort,
  UserProfile,
} from '../../../application/ports/user-repository.port';
import { User } from '../../../domain/user';

@Injectable()
export class UserPrismaRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.runWithReconnect(() =>
      this.prisma.user.findUnique({
        where: { id },
      }),
    );

    return user ? UserMapper.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.runWithReconnect(() =>
      this.prisma.user.findUnique({
        where: { email },
      }),
    );

    return user ? UserMapper.toDomain(user) : null;
  }

  async findByIdWithProfile(id: string): Promise<UserProfile | null> {
    const user = await this.prisma.runWithReconnect(() =>
      this.prisma.user.findUnique({
        where: { id },
        include: {
          settings: true,
          modules: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      }),
    );

    if (!user) return null;

    return {
      user: UserMapper.toDomain(user),
      settings: user.settings
        ? UserSettingsMapper.toDomain(user.settings)
        : null,
      modules: user.modules.map(UserModuleMapper.toDomain),
    };
  }

  async save(user: User): Promise<User> {
    const data = UserMapper.toPersistence(user);
    const created = await this.prisma.user.create({ data });
    return UserMapper.toDomain(created);
  }

  async update(user: User): Promise<User> {
    const data = UserMapper.toPersistence(user);
    const updated = await this.prisma.user.update({
      where: { id: data.id },
      data: {
        name: data.name,
        avatarUrl: data.avatarUrl,
        isActive: data.isActive,
        updatedAt: data.updatedAt,
      },
    });
    return UserMapper.toDomain(updated);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.runWithReconnect(() =>
      this.prisma.user.count({
        where: { email },
      }),
    );
    return count > 0;
  }
}
