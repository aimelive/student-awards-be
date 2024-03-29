import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from './user.guard';
import { Role } from '@prisma/client';
import { LoginDto } from './dto/login-user.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ObjectIdValidationPipe } from '../utils/helpers';
import { AuthUser } from './users.decorator';
import { AuthToken } from '../@interfaces/auth-token';

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
  @HttpCode(200)
  @ApiOperation({
    summary: 'Login',
    description: 'Sign in to your account. Verified user only.',
  })
  login(@Body() loginDto: LoginDto) {
    return this.usersService.login(loginDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get users',
    description: 'Get all user accounts in our system',
  })
  @UseGuards(AuthGuard(Role.ADMIN))
  findAll(@AuthUser() authToken: AuthToken) {
    return this.usersService.findAll(authToken);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard(Role.ADMIN))
  @ApiOperation({
    summary: 'Get one user',
    description: 'Get one user information',
  })
  findOne(@Param('id', ObjectIdValidationPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user account',
    description: 'Update user account informations',
  })
  @UseGuards(AuthGuard(Role.ADMIN))
  update(
    @Param('id', ObjectIdValidationPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    //Notify the super admin about the updated data
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete user forever',
    description: 'Delete user account and related data from our system forever',
  })
  @UseGuards(AuthGuard(Role.ADMIN))
  remove(@Param('id', ObjectIdValidationPipe) id: string) {
    //Notify super admin that the user has deleted successfully
    return this.usersService.remove(id);
  }
}
