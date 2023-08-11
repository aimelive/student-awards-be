import { ApiProperty } from '@nestjs/swagger';
import { SeasonName } from '@prisma/client';
import { IsDateString, IsEnum } from 'class-validator';

export class CreateSeasonDto {
  @ApiProperty({
    default: SeasonName.SEASON_2,
    description: 'Name of the season',
  })
  @IsEnum(SeasonName)
  name: SeasonName;

  @ApiProperty({
    default: '2021-05-21T16:30:00',
    description: 'Date of the season event',
  })
  @IsDateString()
  date: string;
}
