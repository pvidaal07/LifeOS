import {
  Controller,
  Get,
  Patch,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil del usuario actual' })
  getProfile(@CurrentUser('sub') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Actualizar perfil' })
  updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('me/settings')
  @ApiOperation({ summary: 'Actualizar configuración' })
  updateSettings(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.usersService.updateSettings(userId, dto);
  }

  @Put('me/modules')
  @ApiOperation({ summary: 'Actualizar módulos activos del menú' })
  updateModules(
    @CurrentUser('sub') userId: string,
    @Body() modules: UpdateModuleDto[],
  ) {
    return this.usersService.updateModules(userId, modules);
  }

  @Get('me/modules')
  @ApiOperation({ summary: 'Obtener módulos activos' })
  getActiveModules(@CurrentUser('sub') userId: string) {
    return this.usersService.getActiveModules(userId);
  }
}
