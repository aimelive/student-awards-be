import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseEnumPipe,
  UseGuards,
} from '@nestjs/common';
import { SeasonsService } from './seasons.service';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';
import { Role, SeasonName } from '@prisma/client';
import { AuthGuard } from 'src/users/user.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller({ path: 'seasons', version: '1' })
@ApiTags('Editions')
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Post()
  @ApiOperation({
    summary: 'Add a new season',
    description: 'Create a new year season event',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.SUPER_ADMIN))
  create(@Body() createSeasonDto: CreateSeasonDto) {
    return this.seasonsService.create(createSeasonDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get seasons',
    description: 'Get all event seasons',
  })
  findAll() {
    return this.seasonsService.findAll();
  }

  @Get(':name')
  @ApiOperation({
    summary: 'Get one season',
    description: 'Get single season details',
  })
  findOne(@Param('name', new ParseEnumPipe(SeasonName)) name: SeasonName) {
    return this.seasonsService.findOne(name);
  }

  @Patch(':name')
  @ApiOperation({
    summary: 'Update season',
    description: 'Update details of a season',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.SUPER_ADMIN))
  update(
    @Param('name', new ParseEnumPipe(SeasonName)) name: SeasonName,
    @Body() updateSeasonDto: UpdateSeasonDto,
  ) {
    return this.seasonsService.update(name, updateSeasonDto);
  }

  @Delete(':name')
  @ApiOperation({
    summary: 'Delete season',
    description: 'Delete a season event from the system forever',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.SUPER_ADMIN))
  remove(@Param('name', new ParseEnumPipe(SeasonName)) name: SeasonName) {
    return this.seasonsService.remove(name);
  }
}
