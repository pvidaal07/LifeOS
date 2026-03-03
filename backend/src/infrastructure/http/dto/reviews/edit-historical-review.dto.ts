import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsISO8601, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class EditHistoricalReviewDto {
  @ApiPropertyOptional({
    description: 'Fecha historica del repaso completado (ISO-8601)',
    example: '2026-02-01T10:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  completedDate?: string;

  @ApiPropertyOptional({
    enum: ['perfect', 'good', 'regular', 'bad'],
    description: 'Nuevo resultado historico del repaso',
  })
  @IsOptional()
  @IsIn(['perfect', 'good', 'regular', 'bad'])
  result?: 'perfect' | 'good' | 'regular' | 'bad';

  @ApiPropertyOptional({
    description: 'Duracion historica en minutos del repaso asociado',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Calidad percibida de la sesion de repaso asociada (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  qualityRating?: number;

  @ApiPropertyOptional({
    description: 'Horas de estudio del repaso asociado (se convierte internamente a minutos)',
    minimum: 0.01,
    example: 1.5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  studyHours?: number;
}
