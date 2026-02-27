import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

// Módulos que se crean por defecto para cada usuario nuevo
const DEFAULT_MODULES = [
  { key: 'dashboard', order: 0 },
  { key: 'studies', order: 1 },
  { key: 'sports', order: 2 },
  { key: 'nutrition', order: 3 },
  { key: 'habits', order: 4 },
];

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Registrar un nuevo usuario
   */
  async register(dto: RegisterDto) {
    // Verificar si el email ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Crear usuario con toda su configuración inicial
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
        name: dto.name,
        settings: {
          create: {
            timezone: 'Europe/Madrid',
            theme: 'system',
            locale: 'es',
          },
        },
        reviewSettings: {
          create: {
            baseIntervals: [1, 7, 30, 90],
            perfectMultiplier: 2.5,
            goodMultiplier: 2.0,
            regularMultiplier: 1.2,
            badReset: true,
          },
        },
        modules: {
          create: DEFAULT_MODULES.map((mod) => ({
            moduleKey: mod.key,
            isActive: true,
            displayOrder: mod.order,
          })),
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
    });

    return { user, ...tokens };
  }

  /**
   * Iniciar sesión
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Cuenta desactivada');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      ...tokens,
    };
  }

  /**
   * Refrescar tokens
   */
  async refreshTokens(userId: string, email: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Acceso denegado');
    }

    return this.generateTokens({ sub: user.id, email: user.email });
  }

  /**
   * Generar par de tokens (access + refresh)
   */
  private async generateTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiration'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
