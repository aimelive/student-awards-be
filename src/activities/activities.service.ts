import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { HttpResponse } from 'src/utils/response';
import { Activity } from '@prisma/client';
import {
  AddActivityImageDto,
  RemoveActivityImageDto,
} from './dto/activity-image.dto';

const DELETE_IMAGES_EVENT_NAME = 'delete.images.activities';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly db: PrismaService,
    private cloudinary: CloudinaryService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createActivityDto: CreateActivityDto) {
    let images: string[] = [];
    try {
      images = await Promise.all(
        createActivityDto.images.map((image) =>
          this.cloudinary.uploadImage(image),
        ),
      );
      createActivityDto.images = [];

      const activity = await this.db.$transaction(async (prisma) => {
        const [_profile, activity] = await Promise.all([
          prisma.profile.findFirstOrThrow({
            where: { id: createActivityDto.userProfileId },
          }),
          prisma.activity.create({
            data: { ...createActivityDto, images },
          }),
        ]);
        return activity;
      });

      return new HttpResponse<Activity>(
        'Activity added successfully',
        activity,
      );
    } catch (error) {
      if (images.length) {
        this.eventEmitter.emit(DELETE_IMAGES_EVENT_NAME, <
          EventPayload<string[]>
        >{ data: images });
      }
      if (error?.meta?.cause == 'Expected a record, found none.') {
        error.message = 'The profile does not exist.';
        error.status = 404;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findAll(id?: string) {
    try {
      const activities = await this.db.activity.findMany({
        where: { userProfileId: id },
      });
      return new HttpResponse('Activities retrieved successfully', activities);
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findOne(id: string) {
    try {
      const activity = await this.db.activity.findFirst({
        where: { id },
        include: { userProfile: true },
      });
      if (!activity) {
        throw new NotFoundException('Activity not found in our system');
      }
      return new HttpResponse('Activity retrieved successfully', activity);
    } catch (error) {
      if (error.meta?.message) {
        error.message = error.meta.message;
      }
      if (
        error.message?.includes(
          'Field userProfile is required to return data, got `null` instead.',
        )
      ) {
        error.message = 'The activity trying to retrieve has no profile.';
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async update(id: string, updateActivityDto: UpdateActivityDto) {
    try {
      const updatedActivity = await this.db.activity.update({
        where: { id },
        data: { ...updateActivityDto },
      });
      return new HttpResponse('Activity updated successfully', updatedActivity);
    } catch (error) {
      if (error.meta?.cause) {
        error.status = 404;
        error.message = 'Activity trying to edit does not exist.';
      }
      if (error.meta?.message) {
        error.message = error.meta.message;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async remove(id: string) {
    try {
      const activity = await this.db.activity.delete({
        where: { id },
      });
      if (activity.images.length) {
        this.eventEmitter.emit(DELETE_IMAGES_EVENT_NAME, <
          EventPayload<string[]>
        >{
          data: activity.images,
        });
      }
      return new HttpResponse<Activity>(
        'Activity deleted successfully',
        activity,
      );
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

  async addActivityImage(id: string, addActivityImageDto: AddActivityImageDto) {
    let image: string | undefined = undefined;
    try {
      image = await this.cloudinary.uploadImage(addActivityImageDto.image);
      const activity = await this.db.$transaction(async (prisma) => {
        const updatedActivity = await prisma.activity.update({
          where: { id },
          data: {
            images: { push: image },
          },
        });
        if (updatedActivity?.images?.length > 5) {
          throw new ForbiddenException(
            'Activity should have no more than 5 images',
          );
        }
        return updatedActivity;
      });
      return new HttpResponse<Activity>(
        'Image added successfully to the activity',
        activity,
      );
    } catch (error) {
      if (image) {
        this.eventEmitter.emit(DELETE_IMAGES_EVENT_NAME, <
          EventPayload<string[]>
        >{ data: [image] });
      }
      if (error.meta?.cause) {
        error.status = 404;
        error.message = 'Activity trying to edit does not exist.';
      }
      if (error.meta?.message) {
        error.message = error.meta.message;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async removeActivityImage(
    id: string,
    removeActivityImageDto: RemoveActivityImageDto,
  ) {
    try {
      const activity = await this.db.activity.findFirst({
        where: { id },
      });
      if (!activity) {
        throw new NotFoundException('Activity not found!');
      }

      if (!activity.images.includes(removeActivityImageDto.image)) {
        throw new BadRequestException(
          'This image does not already includes in this activity images',
        );
      }
      if (activity.images.length < 4) {
        throw new BadRequestException(
          'Activity can not have less than 3 images',
        );
      }
      const newImages = activity.images.filter(
        (image) => image !== removeActivityImageDto.image,
      );
      const updatedActivity = await this.db.activity.update({
        where: { id },
        data: { images: { set: newImages } },
      });

      this.eventEmitter.emit(DELETE_IMAGES_EVENT_NAME, <EventPayload<string[]>>{
        data: [removeActivityImageDto.image],
      });

      return new HttpResponse<Activity>(
        'Image removed successfully from the activity.',
        updatedActivity,
      );
    } catch (error) {
      if (error.meta?.cause) {
        error.status = 404;
        error.message = 'Activity trying to edit does not exist.';
      }
      if (error.meta?.message) {
        error.message = error.meta.message;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  @OnEvent(DELETE_IMAGES_EVENT_NAME, { async: true })
  async deleteUploadedImage(payload: EventPayload<string[]>) {
    if (!payload?.data?.length) return;
    const { data: images } = payload;
    Promise.all(images.map((image) => this.cloudinary.deleteImage(image)));
  }
}
