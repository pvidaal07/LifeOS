import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtener perfil completo del usuario
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        settings: true,
        modules: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  /**
   * Actualizar datos básicos del perfil
   */
  async updateProfile(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        avatarUrl: dto.avatarUrl,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    });
  }

  /**
   * Actualizar configuración (timezone, theme, locale)
   */
  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        ...dto,
      },
    });
  }

  /**
   * Actualizar módulos activos del usuario (menú configurable)
   */
  async updateModules(userId: string, modules: UpdateModuleDto[]) {
    const operations = modules.map((mod) =>
      this.prisma.userModule.upsert({
        where: {
          userId_moduleKey: {
            userId,
            moduleKey: mod.moduleKey,
          },
        },
        update: {
          isActive: mod.isActive,
          displayOrder: mod.displayOrder,
        },
        create: {
          userId,
          moduleKey: mod.moduleKey,
          isActive: mod.isActive,
          displayOrder: mod.displayOrder,
        },
      }),
    );

    return this.prisma.$transaction(operations);
  }

  /**
   * Obtener módulos activos del usuario
   */
  async getActiveModules(userId: string) {
    return this.prisma.userModule.findMany({
      where: { userId, isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }
}
