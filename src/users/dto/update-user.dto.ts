import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Status } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @ApiProperty({ default: Status.ACTIVE })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;
}
