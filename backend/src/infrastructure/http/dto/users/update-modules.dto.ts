import { IsString, IsBoolean, IsInt, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateModuleDto {
  @ApiProperty({ example: 'studies' })
  @IsString()
  moduleKey: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  displayOrder?: number;
}
