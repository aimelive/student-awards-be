import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpResponse } from '../utils/response';
import { CreateProfileDto } from './dto/create-profile.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    private readonly db: PrismaService,
    private cloudinary: CloudinaryService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(id: string, createProfileDto: CreateProfileDto) {
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
        this.eventEmitter.emit('delete.profile-image', profilePic);
      }
      if (error.meta?.target === 'Profile_userId_key') {
        error.message = 'Profile already exists';
        error.status = 409;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findAll() {
    const profiles = await this.db.profile.findMany();
    return new HttpResponse('User profiles retrieved successfully', profiles);
  }

  async update(id: string, updateProfileDto: UpdateProfileDto) {
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
        this.eventEmitter.emit('delete.profile-image', profilePic);
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

  async findOne(id: string, options?: { byUserId?: boolean }) {
    try {
      let where: { id?: string; userId?: string } = { id };

      if (options?.byUserId) {
        where = { userId: id };
      }

      const profile = await this.db.profile.findFirst({
        where,
        include: {
          user: true,
          _count: true,
        },
      });
      if (!profile) {
        throw new NotFoundException(
          options?.byUserId
            ? `Profile with this user Id '${id}' isn't  found in our system`
            : 'Profile not found!',
        );
      }
      return new HttpResponse('User info retrieved successfully', {
        ...profile,
        user: { ...profile.user, password: undefined },
      });
    } catch (error) {
      if (error.meta?.message) {
        error.message = error.meta.message;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  @OnEvent('delete.profile-image', { async: true })
  async deleteUploadedImage(payload: string) {
    await this.cloudinary.deleteImage(payload);
  }
}
