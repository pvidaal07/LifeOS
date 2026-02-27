import { IsOptional, IsInt, Min, Max, IsString, IsIn, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTopicDto {
  @ApiPropertyOptional({ example: 'Normalización' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'Formas normales: 1FN, 2FN, 3FN, BCNF' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 10,
    description: 'Nivel de dominio manual (1-10)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  masteryLevel?: number;

  @ApiPropertyOptional({ enum: ['not_started', 'in_progress', 'mastered'] })
  @IsOptional()
  @IsString()
  @IsIn(['not_started', 'in_progress', 'mastered'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
