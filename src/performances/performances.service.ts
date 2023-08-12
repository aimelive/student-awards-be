import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePerformanceDto } from './dto/create-performance.dto';
import { UpdatePerformanceDto } from './dto/update-performance.dto';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpResponse } from 'src/utils/response';
import { Performance } from '@prisma/client';
import {
  AddPerformanceImageDto,
  RemovePerformanceImageDto,
} from './dto/add-perfromance-image.dto';

const DELETE_IMAGES_EVENT_NAME = 'delete.images.multiple';

@Injectable()
export class PerformancesService {
  constructor(
    private readonly db: PrismaService,
    private cloudinary: CloudinaryService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createPerformanceDto: CreatePerformanceDto) {
    let images: string[] = [];
    try {
      images = await Promise.all(
        createPerformanceDto.images.map((image) =>
          this.cloudinary.uploadImage(image),
        ),
      );
      createPerformanceDto.images = [];

      const performance = await this.db.$transaction(async (prisma) => {
        const [_profile, perform] = await Promise.all([
          prisma.profile.findFirstOrThrow({
            where: { id: createPerformanceDto.userProfileId },
          }),
          prisma.performance.create({
            data: { ...createPerformanceDto, images },
          }),
        ]);
        return perform;
      });

      return new HttpResponse<Performance>(
        'Performance added successfully',
        performance,
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
      const performances = await this.db.performance.findMany({
        where: { userProfileId: id },
      });
      return new HttpResponse(
        'Performances retrieved successfully',
        performances,
      );
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findOne(id: string) {
    try {
      const performance = await this.db.performance.findFirst({
        where: { id },
        include: { userProfile: true },
      });
      if (!performance) {
        throw new NotFoundException('Performance not found in our system');
      }
      return new HttpResponse(
        'Performance retrieved successfully',
        performance,
      );
    } catch (error) {
      if (error.meta?.message) {
        error.message = error.meta.message;
      }
      if (
        error.message?.includes(
          'Field userProfile is required to return data, got `null` instead.',
        )
      ) {
        error.message = 'The performance trying to retrieve has no profile.';
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async update(id: string, updatePerformanceDto: UpdatePerformanceDto) {
    try {
      const updatedPerformance = await this.db.performance.update({
        where: { id },
        data: { ...updatePerformanceDto },
      });
      return new HttpResponse(
        'Performance updated successfully',
        updatedPerformance,
      );
    } catch (error) {
      if (error.meta?.cause) {
        error.status = 404;
        error.message = 'Performance trying to edit does not exist.';
      }
      if (error.meta?.message) {
        error.message = error.meta.message;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async addPerformanceImage(
    id: string,
    addPerformanceImageDto: AddPerformanceImageDto,
  ) {
    let image: string | undefined = undefined;
    try {
      image = await this.cloudinary.uploadImage(addPerformanceImageDto.image);
      const performance = await this.db.$transaction(async (prisma) => {
        const updatedPerformance = await prisma.performance.update({
          where: { id },
          data: {
            images: { push: image },
          },
        });
        if (updatedPerformance?.images?.length > 5) {
          throw new ForbiddenException(
            'Performance should have no more than 5 images',
          );
        }
        return updatedPerformance;
      });
      return new HttpResponse<Performance>(
        'Image added successfully to the performance',
        performance,
      );
    } catch (error) {
      if (image) {
        this.eventEmitter.emit(DELETE_IMAGES_EVENT_NAME, <
          EventPayload<string[]>
        >{ data: [image] });
      }
      if (error.meta?.cause) {
        error.status = 404;
        error.message = 'Performance trying to edit does not exist.';
      }
      if (error.meta?.message) {
        error.message = error.meta.message;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async removePerformanceImage(
    id: string,
    removePerformanceImageDto: RemovePerformanceImageDto,
  ) {
    try {
      const performance = await this.db.performance.findFirst({
        where: { id },
      });
      if (!performance) {
        throw new NotFoundException('Performance not found!');
      }

      if (!performance.images.includes(removePerformanceImageDto.image)) {
        throw new BadRequestException(
          'This image does not already includes in this performance images',
        );
      }
      if (performance.images.length < 4) {
        throw new BadRequestException(
          'Performance can not have less than 3 images',
        );
      }
      const newImages = performance.images.filter(
        (image) => image !== removePerformanceImageDto.image,
      );
      const updatedPerformance = await this.db.performance.update({
        where: { id },
        data: { images: { set: newImages } },
      });

      this.eventEmitter.emit(DELETE_IMAGES_EVENT_NAME, <EventPayload<string[]>>{
        data: [removePerformanceImageDto.image],
      });

      return new HttpResponse<Performance>(
        'Image removed successfully from the performance.',
        updatedPerformance,
      );
    } catch (error) {
      if (error.meta?.cause) {
        error.status = 404;
        error.message = 'Performance trying to edit does not exist.';
      }
      if (error.meta?.message) {
        error.message = error.meta.message;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async remove(id: string) {
    try {
      const performance = await this.db.performance.delete({
        where: { id },
      });
      if (performance.images.length) {
        this.eventEmitter.emit(DELETE_IMAGES_EVENT_NAME, <
          EventPayload<string[]>
        >{
          data: performance.images,
        });
      }
      return new HttpResponse('Performance deleted successfully', performance);
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

  @OnEvent(DELETE_IMAGES_EVENT_NAME, { async: true })
  async deleteUploadedImage(payload: EventPayload<string[]>) {
    if (!payload?.data?.length) return;
    const { data: images } = payload;
    Promise.all(images.map((image) => this.cloudinary.deleteImage(image)));
    console.log(`${images.length} performance images deleted`);
  }
}
