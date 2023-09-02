import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAwardDto } from './dto/create-award.dto';
import { UpdateAwardDto } from './dto/update-award.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { HttpResponse } from '../utils/response';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { isString } from 'class-validator';
import { Award } from '@prisma/client';

const DELETE_IMAGE_EVENT_NAME = 'delete.image.awards';

@Injectable()
export class AwardsService {
  constructor(
    private readonly db: PrismaService,
    private cloudinary: CloudinaryService,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  async create(createAwardDto: CreateAwardDto) {
    let image: string | undefined = undefined;
    try {
      image = await this.cloudinary.uploadImage(createAwardDto.image);

      createAwardDto.image = undefined;

      const award = await this.db.$transaction(async (prisma) => {
        const [_profile, _season, award] = await Promise.all([
          prisma.profile.findFirstOrThrow({
            where: { id: createAwardDto.userProfileId },
          }),
          prisma.season.findFirstOrThrow({
            where: { name: createAwardDto.seasonName },
          }),
          prisma.award.create({
            data: { ...createAwardDto, featuredPhoto: image },
          }),
        ]);
        return award;
      });
      return new HttpResponse<Award>('Award added successfully', award);
    } catch (error) {
      if (image) {
        this.eventEmitter.emit(DELETE_IMAGE_EVENT_NAME, <EventPayload<string>>{
          data: image,
        });
      }
      if (error.meta?.cause) {
        error.message =
          "Sorry, season or user profile Id you're trying to add does not exist in our system. please try again or contact an admin for help.";
      }
      if (error.meta?.message) {
        error.message = error.meta.message;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findAll() {
    try {
      const awards = await this.db.award.findMany();
      return new HttpResponse('Awards retrieved successfully!', awards);
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findOne(id: string) {
    try {
      const award = await this.db.award.findFirst({
        where: { id },
        include: { season: true, userProfile: true },
      });
      if (!award) {
        throw new NotFoundException('Award not found.');
      }
      return new HttpResponse('Award retrieved successfully', award);
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findWardsByUser(id: string) {
    try {
      const awards = await this.db.award.findMany({
        where: { userProfileId: id },
      });
      return new HttpResponse<Award[]>('Awards retrieved successfully', awards);
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async update(id: string, updateAwardDto: UpdateAwardDto) {
    let image: string | undefined = undefined;
    try {
      if (updateAwardDto.image) {
        image = await this.cloudinary.uploadImage(updateAwardDto.image);
        updateAwardDto.image = undefined;
      }
      const award = await this.db.award.update({
        where: { id },
        data: { ...updateAwardDto, featuredPhoto: image },
      });
      return new HttpResponse('Award updated successfully', award);
    } catch (error) {
      if (image) {
        this.eventEmitter.emit(DELETE_IMAGE_EVENT_NAME, <EventPayload<string>>{
          data: image,
        });
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

  async downloadCertificate(id: string) {
    try {
      const award = await this.db.award.findFirst({ where: { id } });
      if (!award) {
        throw new NotFoundException('Certificate not found!');
      }
      if (award.certificateDownloads == 0) {
        throw new ForbiddenException(
          'This certificate has been downloaded 5 times, please contact an admin for help.',
        );
      }
      const updatedAward = await this.db.award.update({
        where: { id },
        data: {
          certificateDownloads: award.certificateDownloads - 1,
          certificateLastDownloadedAt: new Date(),
        },
      });
      return new HttpResponse('Award updated successfully', updatedAward);
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
      const award = await this.db.award.delete({
        where: { id },
      });
      if (award.featuredPhoto) {
        this.eventEmitter.emit(DELETE_IMAGE_EVENT_NAME, <EventPayload<string>>{
          data: award.featuredPhoto,
        });
      }
      return new HttpResponse('Award deleted successfully', award);
    } catch (error) {
      if (error.meta?.cause) {
        error.status = 404;
        error.message = error.meta.cause;
      }
      if (error.meta?.message) {
        error.message = error.meta.message;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  @OnEvent(DELETE_IMAGE_EVENT_NAME, { async: true })
  async deleteUploadedImage(payload: EventPayload<string>) {
    if (!payload.data || !isString(payload.data)) return;
    await this.cloudinary.deleteImage(payload.data);
  }
}
