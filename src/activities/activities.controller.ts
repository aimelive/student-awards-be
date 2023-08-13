import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../users/user.guard';
import { Role } from '@prisma/client';
import { ObjectIdValidationPipe } from '../utils/helpers';
import {
  AddActivityImageDto,
  RemoveActivityImageDto,
} from './dto/activity-image.dto';

@Controller({ path: 'activities', version: '1' })
@ApiTags('News')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @ApiOperation({
    summary: 'Add a new activity',
    description: 'Create a new user activity',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.ADMIN))
  create(@Body() createActivityDto: CreateActivityDto) {
    return this.activitiesService.create(createActivityDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get activities',
    description: 'Retrieve all activities',
  })
  findAll() {
    return this.activitiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get activity',
    description: 'Retrieve activity details',
  })
  findOne(@Param('id', ObjectIdValidationPipe) id: string) {
    return this.activitiesService.findOne(id);
  }

  @Get('profile/:id')
  @ApiOperation({
    summary: 'Get activities by profile Id',
    description: 'Retrieve all activities by user profile Id',
  })
  findOneByProfileId(@Param('id', ObjectIdValidationPipe) id: string) {
    return this.activitiesService.findAll(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update activity',
    description: 'Update activity information but not images.',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.ADMIN))
  update(
    @Param('id', ObjectIdValidationPipe) id: string,
    @Body() updateActivityDto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(id, updateActivityDto);
  }

  @Patch('addImage/:id')
  @ApiOperation({
    summary: 'Add activity image',
    description: 'Add a activity image. 5 maximum',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.ADMIN))
  addImage(
    @Param('id', ObjectIdValidationPipe) id: string,
    @Body() dto: AddActivityImageDto,
  ) {
    return this.activitiesService.addActivityImage(id, dto);
  }

  @Patch('removeImage/:id')
  @ApiOperation({
    summary: 'Remove activity image',
    description: 'Remove a activity image. 3 minimum',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.ADMIN))
  removeImage(
    @Param('id', ObjectIdValidationPipe) id: string,
    @Body() dto: RemoveActivityImageDto,
  ) {
    return this.activitiesService.removeActivityImage(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove activity',
    description: 'Delete activity forever from the system.',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.ADMIN))
  remove(@Param('id', ObjectIdValidationPipe) id: string) {
    return this.activitiesService.remove(id);
  }
}
