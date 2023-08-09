import { ApiProperty } from '@nestjs/swagger';
import {
  IsAlphanumeric,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
} from 'class-validator';

export class CreateProfileDto {
  @ApiProperty({ default: 'aimelive250' })
  @IsAlphanumeric()
  @Length(5, 20)
  username: string;

  @ApiProperty({ default: 'https://image.png' })
  @IsString()
  image: string;

  @ApiProperty({ default: '0786385773' })
  @IsOptional()
  @IsPhoneNumber('RW', {
    message: 'please enter a valid phone number',
  })
  phoneNumber?: string;

  @ApiProperty({ default: 'The best rapper you should know' })
  @IsString()
  @Length(3, 300)
  bio: string;
}
