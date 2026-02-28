import { IsOptional, IsArray, IsNumber, IsBoolean, Min, ArrayMinSize } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReviewSettingsDto {
  @ApiPropertyOptional({
    example: [1, 7, 30, 90],
    description: 'Intervalos base en días entre repasos',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  baseIntervals?: number[];

  @ApiPropertyOptional({
    example: 2.5,
    description: 'Multiplicador para resultado "perfecto"',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  perfectMultiplier?: number;

  @ApiPropertyOptional({
    example: 2.0,
    description: 'Multiplicador para resultado "bien"',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  goodMultiplier?: number;

  @ApiPropertyOptional({
    example: 1.2,
    description: 'Multiplicador para resultado "regular"',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  regularMultiplier?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Si true, resultado "mal" reinicia al intervalo base. Si false, reduce a la mitad.',
  })
  @IsOptional()
  @IsBoolean()
  badReset?: boolean;
}
