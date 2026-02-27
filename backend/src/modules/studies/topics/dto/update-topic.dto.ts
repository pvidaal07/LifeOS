import { PartialType, OmitType } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateTopicDto } from './create-topic.dto';

export class UpdateTopicDto extends PartialType(
  OmitType(CreateTopicDto, ['subjectId']),
) {
  @ApiPropertyOptional({ minimum: 1, maximum: 10, description: 'Nivel de dominio manual (1-10)' })
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
