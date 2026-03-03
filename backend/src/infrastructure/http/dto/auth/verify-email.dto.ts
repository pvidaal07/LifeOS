import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail({}, { message: 'Email invalido' })
  email: string;

  @ApiProperty({ example: 'AB12CD' })
  @IsString()
  @Length(6, 6, { message: 'El código debe tener 6 caracteres' })
  @Matches(/^[A-Za-z0-9]{6}$/, {
    message: 'El código solo debe contener letras y números',
  })
  code: string;
}
