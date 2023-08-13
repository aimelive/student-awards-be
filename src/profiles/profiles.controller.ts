import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../users/user.guard';
import { Role } from '@prisma/client';
import { ObjectIdValidationPipe } from '../utils/helpers';

@Controller({ path: 'profile', version: '1' })
@ApiTags('Profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post(':id')
  @ApiOperation({
    summary: 'Create a user profile',
    description: 'Create a profile for existing user with no profile.',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.ADMIN))
  createProfile(
    @Param('id', ObjectIdValidationPipe) id: string,
    @Body() createProfileDto: CreateProfileDto,
  ) {
    return this.profilesService.create(id, createProfileDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get profiles',
    description: 'Get all user profiles in our system',
  })
  @UseGuards(AuthGuard(Role.ADMIN))
  findAll() {
    return this.profilesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one user profile',
    description: 'Get one user profile information',
  })
  findOneProfile(@Param('id', ObjectIdValidationPipe) id: string) {
    return this.profilesService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get profile by userId',
    description: 'Get one user profile information by passing user Id',
  })
  findOneProfileByUserId(
    @Param('userId', ObjectIdValidationPipe) userId: string,
  ) {
    return this.profilesService.findOne(userId, { byUserId: true });
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.ADMIN))
  @ApiOperation({
    summary: 'Update profile',
    description: 'Update a profile of a user',
  })
  updateProfile(
    @Param('id', ObjectIdValidationPipe) id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profilesService.update(id, updateProfileDto);
  }
}
