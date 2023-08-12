import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString, Length } from 'class-validator';

export class UpdateActivityDto {
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
  caption?: string;

  @ApiProperty({ default: '64d30d481e904aae2bc3179f' })
  @IsOptional()
  @IsMongoId({ message: 'The userId must be a valid MongoDB ObjectId' })
  userProfileId?: string;
}
