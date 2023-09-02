import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsStrongPassword, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({ default: 'aimendayambaje24@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ default: 'Umuhungu@123' })
  @Length(5, 15)
  @IsStrongPassword()
  password: string;
}
