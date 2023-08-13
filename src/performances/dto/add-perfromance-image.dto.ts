import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsString } from 'class-validator';
import { IsCloudinaryUrl } from '../../utils/helpers';

export class AddPerformanceImageDto {
  @ApiProperty({
    default:
      'https://cdn.pixabay.com/photo/2023/08/06/17/13/roads-8173354_1280.jpg',
  })
  @IsDefined({ message: 'Image required' })
  @IsString()
  image: string;
}

export class RemovePerformanceImageDto {
  @ApiProperty({
    default:
      'https://res.cloudinary.com/dofeqwgfb/image/upload/v1691725501/MCSA-Student-Awards/pagqy1ug8s4cvxiwn6e8.jpg',
  })
  @IsDefined({ message: 'Image required' })
  @IsCloudinaryUrl()
  @IsString()
  image: string;
}
