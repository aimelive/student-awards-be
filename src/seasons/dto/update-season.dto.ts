import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class UpdateSeasonDto {
  @ApiProperty({
    default: '2023-12-05T16:34:00',
    description: 'Date of the season event',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
