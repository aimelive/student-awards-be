import { ApiProperty } from '@nestjs/swagger';
import { AwardCategory, SeasonName } from '@prisma/client';
import {
  IsDefined,
  IsEnum,
  IsMongoId,
  IsString,
  Length,
} from 'class-validator';

export class CreateAwardDto {
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
  caption: string;

  @ApiProperty({
    default: AwardCategory.Singer,
  })
  @IsEnum(AwardCategory)
  category: AwardCategory;

  @ApiProperty({ default: '64d30d481e904aae2bc3179f' })
  @IsMongoId({
    message: (value) => {
      return `Invalid user profile Id: <b>${value.value}</b>`;
    },
  })
  userProfileId: string;

  @ApiProperty({
    default: SeasonName.SEASON_2,
    description: 'Name of the season',
  })
  @IsEnum(SeasonName)
  seasonName: SeasonName;

  @ApiProperty({
    default:
      'https://cdn.pixabay.com/photo/2023/08/06/17/13/roads-8173354_1280.jpg',
  })
  @IsString()
  image: string;
}
