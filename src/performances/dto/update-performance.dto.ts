import { ApiProperty } from '@nestjs/swagger';
import { SeasonName } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { IsCustomDurationFormat, IsYouTubeUrl } from '../../utils/helpers';

export class UpdatePerformanceDto {
  @ApiProperty({
    default: SeasonName.SEASON_2,
    description: 'Name of the season',
  })
  @IsOptional()
  @IsEnum(SeasonName)
  seasonName?: SeasonName;

  @ApiProperty({ default: 'https://youtu.be/zAeXLFSQRbk' })
  @IsOptional()
  @IsYouTubeUrl()
  videoUrl?: string;

  @ApiProperty({ default: '12:54' })
  @IsOptional()
  @IsCustomDurationFormat()
  duration?: string;

  @ApiProperty({ default: 'Translators Dance Crew: Chasing the clout' })
  @IsOptional()
  @IsString()
  @Length(20, 100)
  title?: string;

  @ApiProperty({
    default:
      'murakoze cyane yari njy mamsj fdhfjhkd k fdjhfd kdksdfhfjsdflsdkf',
  })
  @IsOptional()
  @IsString()
  @Length(50, 300)
  description?: string;
}
