import { IsString, IsOptional, IsInt, Min, Max, IsUUID, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({ description: 'ID del tema estudiado' })
  @IsUUID()
  topicId: string;

  @ApiPropertyOptional({
    enum: ['first_time', 'review', 'practice'],
    description: 'Tipo de sesión (se detecta automáticamente si no se especifica)',
  })
  @IsOptional()
  @IsString()
  @IsIn(['first_time', 'review', 'practice'])
  sessionType?: string;

  @ApiPropertyOptional({ description: 'Duración en minutos' })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 5,
    description: 'Calidad percibida (1-5)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  qualityRating?: number;

  @ApiPropertyOptional({ description: 'Notas sobre la sesión' })
  @IsOptional()
  @IsString()
  notes?: string;
}
