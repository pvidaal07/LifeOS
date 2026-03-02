import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'miPassword123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'miPassword456' })
  @IsString()
  @MinLength(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
  @MaxLength(100)
  newPassword: string;
}
