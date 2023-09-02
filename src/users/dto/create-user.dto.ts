import { ApiProperty } from '@nestjs/swagger';
import { Role, Status } from '@prisma/client';
import {
  IsAlpha,
  IsDefined,
  IsEmail,
  IsEnum,
  IsOptional,
  IsStrongPassword,
  Length,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ default: 'Aime' })
  @IsDefined({ message: 'first name required' })
  @Length(3, 20)
  @IsAlpha()
  firstName: string;

  @ApiProperty({ default: 'Ndayambaje' })
  @Length(3, 20)
  @IsAlpha()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ default: 'aimendayambaje24@gmail.com' })
  @IsEmail()
  @IsDefined({ message: 'please enter email' })
  email: string;

  @ApiProperty({ default: 'Umuhungu@123' })
  @Length(5, 15)
  @IsOptional()
  @IsStrongPassword(undefined, { message: 'please enter a strong password' })
  password?: string;

  @ApiProperty({ default: Role.USER })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ default: Status.IDLE })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
