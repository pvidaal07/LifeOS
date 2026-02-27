import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Inject,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { USE_CASE_TOKENS } from '../use-case-tokens';
import { RegisterUseCase } from '../../../application/use-cases/auth';
import { LoginUseCase } from '../../../application/use-cases/auth';
import { RefreshTokensUseCase } from '../../../application/use-cases/auth';
import { GetProfileUseCase } from '../../../application/use-cases/users';
import { JwtAuthGuard, JwtRefreshAuthGuard, CurrentUser } from '../../auth';
import { RegisterDto, LoginDto } from '../dto/auth';
import { UsersController } from './users.controller';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(USE_CASE_TOKENS.RegisterUseCase)
    private readonly registerUseCase: RegisterUseCase,
    @Inject(USE_CASE_TOKENS.LoginUseCase)
    private readonly loginUseCase: LoginUseCase,
    @Inject(USE_CASE_TOKENS.RefreshTokensUseCase)
    private readonly refreshTokensUseCase: RefreshTokensUseCase,
    @Inject(USE_CASE_TOKENS.GetProfileUseCase)
    private readonly getProfileUseCase: GetProfileUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.registerUseCase.execute({
      email: dto.email,
      password: dto.password,
      name: dto.name,
    });

    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.loginUseCase.execute({
      email: dto.email,
      password: dto.password,
    });

    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar access token' })
  async refresh(
    @CurrentUser('sub') userId: string,
    @CurrentUser('email') email: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.refreshTokensUseCase.execute(userId, email);
    this.setRefreshTokenCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión' })
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token');
    return { message: 'Sesión cerrada correctamente' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  async getProfile(@CurrentUser('sub') userId: string) {
    const profile = await this.getProfileUseCase.execute(userId);
    return UsersController.mapProfile(profile);
  }

  /**
   * Establece el refresh token como cookie httpOnly
   */
  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      path: '/api/v1/auth/refresh',
    });
  }
}
