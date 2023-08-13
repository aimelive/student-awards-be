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
import { AuthGuard } from '../users/user.guard';
import { PerformancesService } from './performances.service';
import { CreatePerformanceDto } from './dto/create-performance.dto';
import { UpdatePerformanceDto } from './dto/update-performance.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ObjectIdValidationPipe } from '../utils/helpers';
import {
  AddPerformanceImageDto,
  RemovePerformanceImageDto,
} from './dto/add-perfromance-image.dto';

@Controller({ path: 'performances', version: '1' })
@ApiTags('Performances')
export class PerformancesController {
  constructor(private readonly performancesService: PerformancesService) {}

  @Post()
  @ApiOperation({
    summary: 'Add a new performance',
    description: 'Create a new year performance',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.ADMIN))
  create(@Body() createPerformanceDto: CreatePerformanceDto) {
    return this.performancesService.create(createPerformanceDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get performances',
    description: 'Retrieve all performances',
  })
  findAll() {
    return this.performancesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get performance',
    description: 'Retrieve performance details',
  })
  findOne(@Param('id', ObjectIdValidationPipe) id: string) {
    return this.performancesService.findOne(id);
  }

  @Get('profile/:id')
  @ApiOperation({
    summary: 'Get performances by profile Id',
    description: 'Retrieve all performances by user profile Id',
  })
  findOneByProfileId(@Param('id', ObjectIdValidationPipe) id: string) {
    return this.performancesService.findAll(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update performance',
    description: 'Update performance information but not images.',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.ADMIN))
  update(
    @Param('id', ObjectIdValidationPipe) id: string,
    @Body() updatePerformanceDto: UpdatePerformanceDto,
  ) {
    return this.performancesService.update(id, updatePerformanceDto);
  }

  @Patch('addImage/:id')
  @ApiOperation({
    summary: 'Add performance image',
    description: 'Add a performance image. 5 maximum',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.ADMIN))
  addImage(
    @Param('id', ObjectIdValidationPipe) id: string,
    @Body() dto: AddPerformanceImageDto,
  ) {
    return this.performancesService.addPerformanceImage(id, dto);
  }

  @Patch('removeImage/:id')
  @ApiOperation({
    summary: 'Remove performance image',
    description: 'Remove a performance image. 3 minimum',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.ADMIN))
  removeImage(
    @Param('id', ObjectIdValidationPipe) id: string,
    @Body() dto: RemovePerformanceImageDto,
  ) {
    return this.performancesService.removePerformanceImage(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove performance',
    description: 'Delete performance forever from the system.',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.ADMIN))
  remove(@Param('id', ObjectIdValidationPipe) id: string) {
    return this.performancesService.remove(id);
  }
}
