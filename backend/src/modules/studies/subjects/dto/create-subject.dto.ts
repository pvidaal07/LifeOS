import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubjectDto {
  @ApiProperty({ description: 'ID del plan de estudio' })
  @IsUUID()
  studyPlanId: string;

  @ApiProperty({ example: 'Bases de Datos' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Fundamentos de bases de datos relacionales' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '#6366f1', description: 'Color en formato hex' })
  @IsOptional()
  @IsString()
  color?: string;
}
