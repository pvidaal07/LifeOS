import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserModuleMapper } from '../mappers/user-module.mapper';
import { UserModuleRepositoryPort } from '../../../application/ports/user-repository.port';
import { UserModule } from '../../../domain/user';

@Injectable()
export class UserModulePrismaRepository implements UserModuleRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveByUserId(userId: string): Promise<UserModule[]> {
    const modules = await this.prisma.userModule.findMany({
      where: { userId, isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    return modules.map(UserModuleMapper.toDomain);
  }

  async upsertMany(userId: string, modules: UserModule[]): Promise<UserModule[]> {
    const operations = modules.map((mod) => {
      const data = UserModuleMapper.toPersistence(mod);

      return this.prisma.userModule.upsert({
        where: {
          userId_moduleKey: {
            userId,
            moduleKey: data.moduleKey,
          },
        },
        update: {
          isActive: data.isActive,
          displayOrder: data.displayOrder,
        },
        create: {
          id: data.id,
          userId,
          moduleKey: data.moduleKey,
          isActive: data.isActive,
          displayOrder: data.displayOrder,
        },
      });
    });

    const results = await this.prisma.$transaction(operations);
    return results.map(UserModuleMapper.toDomain);
  }
}
