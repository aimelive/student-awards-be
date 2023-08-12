import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateAwardDto } from './create-award.dto';

export class UpdateAwardDto extends PartialType(
  OmitType(CreateAwardDto, ['userProfileId']),
) {}
