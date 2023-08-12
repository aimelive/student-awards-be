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
import { AwardsService } from './awards.service';
import { CreateAwardDto } from './dto/create-award.dto';
import { UpdateAwardDto } from './dto/update-award.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/users/user.guard';
import { Role } from '@prisma/client';
import { ObjectIdValidationPipe } from 'src/utils/helpers';

@Controller({ path: 'awards', version: '1' })
@ApiTags('Winners')
export class AwardsController {
  constructor(private readonly awardsService: AwardsService) {}

  @Post()
  @ApiOperation({
    summary: 'Add a new winner',
    description: 'Add a new award winner',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.ADMIN))
  create(@Body() createAwardDto: CreateAwardDto) {
    return this.awardsService.create(createAwardDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get awards',
    description: 'Retrieve all award winners',
  })
  findAll() {
    return this.awardsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get award',
    description: 'Retrieve award details',
  })
  findOne(@Param('id', ObjectIdValidationPipe) id: string) {
    return this.awardsService.findOne(id);
  }

  @Get('profile/:id')
  @ApiOperation({
    summary: 'Get awards by profile user Id',
    description: 'Retrieve all awards by profile user Id',
  })
  findOneByProfile(@Param('id', ObjectIdValidationPipe) id: string) {
    return this.awardsService.findWardsByUser(id);
  }

  @Get('certificate/:id')
  @ApiOperation({
    summary: 'Download certificate',
    description:
      'Download certificate for award by using award Id. 5 times maximum.',
  })
  downloadCertificate(@Param('id', ObjectIdValidationPipe) id: string) {
    return this.awardsService.downloadCertificate(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update award',
    description: 'Update award details',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.ADMIN))
  update(
    @Param('id', ObjectIdValidationPipe) id: string,
    @Body() updateAwardDto: UpdateAwardDto,
  ) {
    return this.awardsService.update(id, updateAwardDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remove award',
    description: 'Delete award winner from the system forever.',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.SUPER_ADMIN))
  remove(@Param('id', ObjectIdValidationPipe) id: string) {
    return this.awardsService.remove(id);
  }
}
