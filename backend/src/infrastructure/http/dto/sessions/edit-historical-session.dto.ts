import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsInt, IsOptional, Max, Min } from 'class-validator';

export class EditHistoricalSessionDto {
  @ApiPropertyOptional({
    description: 'Fecha historica de la sesion de estudio (ISO-8601)',
    example: '2026-02-01T10:30:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  studiedAt?: string;

  @ApiPropertyOptional({
    description: 'Duracion en minutos',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Calidad percibida de la sesion (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  qualityRating?: number;
}
