import { IsString, IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteReviewDto {
  @ApiProperty({
    enum: ['perfect', 'good', 'regular', 'bad'],
    description:
      'Resultado del repaso: perfect (no necesité pensar), good (bien), regular (con dudas), bad (no recordaba)',
  })
  @IsString()
  @IsIn(['perfect', 'good', 'regular', 'bad'])
  result: 'perfect' | 'good' | 'regular' | 'bad';

  @ApiPropertyOptional({ description: 'Duración en minutos' })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 5,
    description: 'Calidad de la sesión (1-5)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  qualityRating?: number;

  @ApiPropertyOptional({ description: 'Notas sobre el repaso' })
  @IsOptional()
  @IsString()
  notes?: string;
}
