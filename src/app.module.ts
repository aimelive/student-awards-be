import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import * as Joi from 'joi';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SeasonsModule } from './seasons/seasons.module';
import { PerformancesModule } from './performances/performances.module';
import { ProfilesModule } from './profiles/profiles.module';
import { AwardsModule } from './awards/awards.module';
import { ActivitiesModule } from './activities/activities.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        PORT: Joi.number().optional(),
      }),
    }),
    CloudinaryModule,
    UsersModule,
    ProfilesModule,
    EventEmitterModule.forRoot(),
    SeasonsModule,
    PerformancesModule,
    AwardsModule,
    ActivitiesModule,
  ],
  controllers: [AppController],
  providers: [CloudinaryService],
})
export class AppModule {}
