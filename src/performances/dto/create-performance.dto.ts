import { ApiProperty } from '@nestjs/swagger';
import { SeasonName } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsDefined,
  IsEnum,
  IsMongoId,
  IsString,
  Length,
} from 'class-validator';
import { IsCustomDurationFormat, IsYouTubeUrl } from '../../utils/helpers';

export class CreatePerformanceDto {
  @ApiProperty({
    default: SeasonName.SEASON_2,
    description: 'Name of the season',
  })
  @IsEnum(SeasonName)
  seasonName: SeasonName;

  @ApiProperty({
    default: [
      'https://cdn.pixabay.com/photo/2023/08/06/17/13/roads-8173354_1280.jpg',
      'https://cdn.pixabay.com/photo/2022/03/20/18/33/usa-7081584_1280.jpg',
      'https://cdn.pixabay.com/photo/2019/10/08/19/21/awards-4535861_1280.jpg',
    ],
  })
  @IsDefined({ message: 'Images required' })
  @ArrayMinSize(3, { message: 'At least 3 images is required' })
  @ArrayMaxSize(5, { message: 'Please enter 5 images only' })
  @ArrayUnique({ message: 'All images must be unique' })
  @IsString({
    each: true,
    message: 'Each item in the images array must be a valid string',
  })
  images: string[];

  @ApiProperty({ default: 'https://youtu.be/zAeXLFSQRbk' })
  @IsYouTubeUrl()
  videoUrl: string;

  @ApiProperty({ default: '12:54' })
  @IsDefined()
  @IsCustomDurationFormat()
  duration: string;

  @ApiProperty({ default: 'Translators Dance Crew: Chasing the clout' })
  @IsString()
  @Length(20, 100)
  title: string;

  @ApiProperty({
    default:
      'murakoze cyane yari njy mamsj fdhfjhkd k fdjhfd kdksdfhfjsdflsdkf',
  })
  @IsString()
  @Length(50, 300)
  description: string;

  @ApiProperty({ default: '64d30d481e904aae2bc3179f' })
  @IsMongoId({ message: 'The userId must be a valid MongoDB ObjectId' })
  userProfileId: string;
}
