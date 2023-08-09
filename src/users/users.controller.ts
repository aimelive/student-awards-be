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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from './user.guard';
import { Role } from '@prisma/client';
import { LoginDto } from './dto/login-user.dto';
import {
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';

@Controller({ path: 'users', version: '1' })
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description: 'An admin may create a new user account',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.ADMIN))
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login',
    description: 'Sign in to your account. Verified user only.',
  })
  login(@Body() loginDto: LoginDto) {
    return this.usersService.login(loginDto);
  }

  @Post('profile/:id')
  @ApiOperation({
    summary: 'Create a user profile',
    description: 'Create a profile for existing user with no profile.',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.ADMIN))
  createProfile(
    @Param('id') id: string,
    @Body() createProfileDto: CreateProfileDto,
  ) {
    return this.usersService.createProfile(id, createProfileDto);
  }

  @Patch('profile/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.ADMIN))
  @ApiOperation({
    summary: 'Update profile',
    description: 'Update a profile of a user',
  })
  updateProfile(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(id, updateProfileDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get profiles',
    description: 'Get all user profiles in our system',
  })
  @UseGuards(AuthGuard(Role.ADMIN))
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one user',
    description: 'Get one user information',
  })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user account',
    description: 'Update user account informations',
  })
  @UseGuards(AuthGuard(Role.ADMIN))
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete user forever',
    description: 'Delete user account and related data from our system forever',
  })
  @UseGuards(AuthGuard(Role.ADMIN))
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
