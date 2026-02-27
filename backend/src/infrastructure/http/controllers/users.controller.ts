import {
  Controller,
  Get,
  Patch,
  Put,
  Body,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { USE_CASE_TOKENS } from '../use-case-tokens';
import { GetProfileUseCase } from '../../../application/use-cases/users';
import { UpdateProfileUseCase } from '../../../application/use-cases/users';
import { UpdateSettingsUseCase } from '../../../application/use-cases/users';
import { UpdateModulesUseCase } from '../../../application/use-cases/users';
import { GetActiveModulesUseCase } from '../../../application/use-cases/users';
import { JwtAuthGuard, CurrentUser } from '../../auth';
import { UpdateProfileDto, UpdateSettingsDto, UpdateModuleDto } from '../dto/users';
import { User, UserSettings, UserModule } from '../../../domain/user';
import { UserProfile } from '../../../application/ports/user-repository.port';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    @Inject(USE_CASE_TOKENS.GetProfileUseCase)
    private readonly getProfileUseCase: GetProfileUseCase,
    @Inject(USE_CASE_TOKENS.UpdateProfileUseCase)
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    @Inject(USE_CASE_TOKENS.UpdateSettingsUseCase)
    private readonly updateSettingsUseCase: UpdateSettingsUseCase,
    @Inject(USE_CASE_TOKENS.UpdateModulesUseCase)
    private readonly updateModulesUseCase: UpdateModulesUseCase,
    @Inject(USE_CASE_TOKENS.GetActiveModulesUseCase)
    private readonly getActiveModulesUseCase: GetActiveModulesUseCase,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil del usuario actual' })
  async getProfile(@CurrentUser('sub') userId: string) {
    const profile = await this.getProfileUseCase.execute(userId);
    return UsersController.mapProfile(profile);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Actualizar perfil' })
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const user = await this.updateProfileUseCase.execute(userId, {
      name: dto.name,
      avatarUrl: dto.avatarUrl,
    });
    return UsersController.mapUserSafe(user);
  }

  @Patch('me/settings')
  @ApiOperation({ summary: 'Actualizar configuración' })
  async updateSettings(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateSettingsDto,
  ) {
    const settings = await this.updateSettingsUseCase.execute(userId, {
      timezone: dto.timezone,
      theme: dto.theme,
      locale: dto.locale,
    });
    return UsersController.mapSettings(settings);
  }

  @Put('me/modules')
  @ApiOperation({ summary: 'Actualizar módulos activos del menú' })
  async updateModules(
    @CurrentUser('sub') userId: string,
    @Body() modules: UpdateModuleDto[],
  ) {
    const result = await this.updateModulesUseCase.execute(
      userId,
      modules.map((m) => ({
        moduleKey: m.moduleKey,
        isActive: m.isActive,
        displayOrder: m.displayOrder ?? 0,
      })),
    );
    return result.map(UsersController.mapModule);
  }

  @Get('me/modules')
  @ApiOperation({ summary: 'Obtener módulos activos' })
  async getActiveModules(@CurrentUser('sub') userId: string) {
    const mods = await this.getActiveModulesUseCase.execute(userId);
    return mods.map(UsersController.mapModule);
  }

  // ─── Presentation mapping helpers ─────────────────────

  /**
   * Maps a UserProfile to the old Prisma-style flat shape:
   * { id, email, name, avatarUrl, createdAt, settings: {...}, modules: [...] }
   */
  static mapProfile(profile: UserProfile) {
    return {
      id: profile.user.id,
      email: profile.user.email,
      name: profile.user.name,
      avatarUrl: profile.user.avatarUrl,
      createdAt: profile.user.createdAt,
      settings: profile.settings ? UsersController.mapSettings(profile.settings) : null,
      modules: profile.modules.map(UsersController.mapModule),
    };
  }

  /**
   * Maps a User domain entity to the safe response shape (no passwordHash).
   */
  private static mapUserSafe(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };
  }

  /**
   * Maps a UserSettings domain entity to the Prisma-style shape.
   */
  private static mapSettings(settings: UserSettings) {
    return {
      id: settings.id,
      userId: settings.userId,
      timezone: settings.timezone,
      theme: settings.theme,
      locale: settings.locale,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }

  /**
   * Maps a UserModule domain entity to the Prisma-style shape.
   */
  private static mapModule(mod: UserModule) {
    return {
      id: mod.id,
      userId: mod.userId,
      moduleKey: mod.moduleKey,
      isActive: mod.isActive,
      displayOrder: mod.displayOrder,
      createdAt: mod.createdAt,
    };
  }
}
