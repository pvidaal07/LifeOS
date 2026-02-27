import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'Europe/Madrid' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 'dark', description: 'system | light | dark' })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiPropertyOptional({ example: 'es' })
  @IsOptional()
  @IsString()
  locale?: string;
}
