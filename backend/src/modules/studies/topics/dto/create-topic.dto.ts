import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTopicDto {
  @ApiProperty({ description: 'ID de la asignatura' })
  @IsUUID()
  subjectId: string;

  @ApiProperty({ example: 'Normalización' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Formas normales: 1FN, 2FN, 3FN, BCNF' })
  @IsOptional()
  @IsString()
  description?: string;
}
