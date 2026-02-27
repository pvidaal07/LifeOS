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
  getProfile(@CurrentUser('sub') userId: string) {
    return this.getProfileUseCase.execute(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Actualizar perfil' })
  updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.updateProfileUseCase.execute(userId, {
      name: dto.name,
      avatarUrl: dto.avatarUrl,
    });
  }

  @Patch('me/settings')
  @ApiOperation({ summary: 'Actualizar configuración' })
  updateSettings(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.updateSettingsUseCase.execute(userId, {
      timezone: dto.timezone,
      theme: dto.theme,
      locale: dto.locale,
    });
  }

  @Put('me/modules')
  @ApiOperation({ summary: 'Actualizar módulos activos del menú' })
  updateModules(
    @CurrentUser('sub') userId: string,
    @Body() modules: UpdateModuleDto[],
  ) {
    return this.updateModulesUseCase.execute(
      userId,
      modules.map((m) => ({
        moduleKey: m.moduleKey,
        isActive: m.isActive,
        displayOrder: m.displayOrder ?? 0,
      })),
    );
  }

  @Get('me/modules')
  @ApiOperation({ summary: 'Obtener módulos activos' })
  getActiveModules(@CurrentUser('sub') userId: string) {
    return this.getActiveModulesUseCase.execute(userId);
  }
}
