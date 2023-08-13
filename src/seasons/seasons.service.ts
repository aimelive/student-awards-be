import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';
import { PrismaService } from '../prisma/prisma.service';
import { HttpResponse } from '../utils/response';
import { SeasonName } from '@prisma/client';

@Injectable()
export class SeasonsService {
  constructor(private readonly db: PrismaService) {}

  async create(createSeasonDto: CreateSeasonDto) {
    try {
      const season = await this.db.season.create({
        data: {
          name: createSeasonDto.name,
          date: new Date(createSeasonDto.date),
        },
      });
      return new HttpResponse('Season created successfully', season);
    } catch (error) {
      if (error.meta?.target === 'Season_name_key') {
        error.message = 'Event season already exists';
        error.status = 409;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async findAll() {
    const seasons = await this.db.season.findMany({
      include: { _count: true },
    });
    return new HttpResponse('Seasons retrieved successfully', seasons);
  }

  async findOne(name: SeasonName) {
    try {
      const season = await this.db.season.findFirst({
        where: { name },
        include: { _count: true, performances: true, awards: true },
      });
      if (!season) {
        throw new NotFoundException(name + ' not found in our system');
      }
      return new HttpResponse('Season retrieved successfully', season);
    } catch (error) {
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async update(name: SeasonName, data: UpdateSeasonDto) {
    try {
      if (!Object.keys(data).length) {
        throw new BadRequestException('No changes made');
      }
      const season = await this.db.season.update({
        where: { name },
        data: {
          date: data.date ? new Date(data.date) : undefined,
        },
      });
      return new HttpResponse('Season updated successfully', season);
    } catch (error) {
      if (error.meta?.target === 'Season_name_key') {
        error.message = 'Event season already exists';
        error.status = 409;
      }
      if (error.meta?.cause) {
        error.status = 404;
        error.message = error.meta.cause;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }

  async remove(name: SeasonName) {
    try {
      const season = await this.db.season.delete({
        where: { name },
      });
      return new HttpResponse('Season deleted successfully', season);
    } catch (error) {
      if (error.meta?.cause) {
        error.status = 404;
        error.message = error.meta.cause;
      }
      throw new HttpException(error.message, error.status || 500);
    }
  }
}
