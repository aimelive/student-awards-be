import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpResponse } from 'src/utils/response';
import { Status, User } from '@prisma/client';
import { comparePwd, generateToken, hashPwd } from 'src/utils/helpers';
import { CreateProfileDto } from './dto/create-profile.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { SchedulerRegistry } from '@nestjs/schedule';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { LoginDto } from './dto/login-user.dto';
import { AuthToken } from 'src/@interfaces/auth-token';

@Injectable()
export class UsersService {
  constructor(
    private readonly db: PrismaService,
    private cloudinary: CloudinaryService,
    private readonly eventEmitter: EventEmitter2,
    private readonly scheduleRegistry: SchedulerRegistry,
  ) {}
  async create(createUserDto: CreateUserDto) {
    try {
      const user = await this.db.user.create({
        data: {
          ...createUserDto,
          password: await hashPwd(createUserDto.password),
          status: Status.IDLE,
        },
      });
      return new HttpResponse('User created successfully!', user);
    } catch (error) {
      if (error.meta?.target === 'User_email_key') {
        error.message = 'This email is already in use';
        error.status = 409;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findAll() {
    const users = await this.db.profile.findMany();
    return new HttpResponse('Users retrieved successfully', users);
  }

  async createProfile(id: string, createProfileDto: CreateProfileDto) {
    let profilePic: string | undefined;
    try {
      if (createProfileDto.image) {
        profilePic = await this.cloudinary.uploadImage(createProfileDto.image);
      }
      const profile = await this.db.$transaction(async (prisma) => {
        const [user, profile] = await Promise.all([
          prisma.user.findUnique({ where: { id } }),
          prisma.profile.create({
            data: {
              username: createProfileDto.username,
              bio: createProfileDto.bio,
              profilePic,
              userId: id,
            },
          }),
        ]);
        if (!user) {
          throw new NotFoundException('User not found!');
        }
        return profile;
      });
      return new HttpResponse('Profile created successfully!', profile);
    } catch (error) {
      if (profilePic) {
        this.eventEmitter.emit('delete.image', profilePic);
      }
      if (error.meta?.target === 'Profile_userId_key') {
        error.message = 'Profile already exists';
        error.status = 409;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }
  async updateProfile(id: string, updateProfileDto: UpdateProfileDto) {
    let profilePic: string | undefined;
    try {
      if (updateProfileDto.image) {
        profilePic = await this.cloudinary.uploadImage(updateProfileDto.image);
      }
      const updatedUser = await this.db.profile.update({
        where: { userId: id },
        data: { profilePic, ...updateProfileDto },
      });

      return new HttpResponse('Profile updated succesfully', updatedUser);
    } catch (error) {
      if (profilePic) {
        this.eventEmitter.emit('delete.image', profilePic);
      }
      if (error.meta?.message) {
        error.message = error.meta.message;
      }
      if (error.meta?.cause) {
        error.status = 404;
        error.message = error.meta.cause;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async login({ email, password }: LoginDto) {
    try {
      const user = await this.db.user.findFirst({
        where: { email },
        include: { profile: true, _count: true },
      });
      if (!user) {
        throw new NotFoundException('Account with this email does not exist.');
      }
      if (!user.verified) {
        throw new ForbiddenException('Account not verified');
      }
      if (user.status !== Status.ACTIVE) {
        throw new ForbiddenException(
          `${user.status} account can not be logged in.`,
        );
      }
      if (!(await comparePwd(password, user.password))) {
        throw new BadRequestException('Incorrect password, try again.');
      }
      return {
        message: 'User logged in successfully!',
        data: { ...user, password: undefined },
        token: generateToken<AuthToken>({ id: user.id, role: user.role }),
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }
  async findOne(id: string) {
    try {
      const user = await this.db.user.findFirst({
        where: { id },
        include: {
          _count: true,
          profile: true,
        },
      });
      return new HttpResponse('User info retrieved successfully', {
        ...user,
        password: undefined,
      });
    } catch (error) {
      if (error.meta?.message) {
        error.message = error.meta.message;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      if (!Object.keys(updateUserDto).length) {
        throw new BadRequestException('No changes made');
      }
      const updateUser = await this.db.user.update({
        where: { id },
        data: {
          ...updateUserDto,
          password: updateUserDto.password
            ? await hashPwd(updateUserDto.password)
            : undefined,
        },
      });
      return new HttpResponse('User account updated successfully', updateUser);
    } catch (error) {
      if (error.meta?.message) {
        error.message = error.meta.message;
      }
      if (error.meta?.cause) {
        error.status = 404;
        error.message = error.meta.cause;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async remove(id: string) {
    try {
      const deletedUser = await this.db.$transaction(async (prisma) => {
        const user = await prisma.user.delete({
          where: { id },
          include: { profile: true, _count: true },
        });
        if (user._count.awards) {
          throw new BadRequestException(
            'Awarded user should not be deleted forever.',
          );
        }
        return user;
      });
      if (deletedUser?.profile?.profilePic) {
        this.eventEmitter.emit(
          'delete.image',
          deletedUser?.profile?.profilePic,
        );
      }
      //TODO: Sending an email that the user has been deleted
      return new HttpResponse(`User deleted successfully!`, deletedUser);
    } catch (error) {
      if (error.meta?.message) {
        error.message = error.meta.message;
      }
      if (error.meta?.cause) {
        error.status = 404;
        error.message = error.meta.cause;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  @OnEvent('delete.image', { async: true })
  async deleteUploadedImage(payload: string) {
    await this.cloudinary.deleteImage(payload);
  }
}