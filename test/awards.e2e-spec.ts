import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { adminCredentials } from './stubs/users';
import { AwardCategory } from '@prisma/client';

describe('AwardsController (E2E)', () => {
  let app: INestApplication;
  let server: any;
  let token: string;
  let awardId: string;
  let awardImage: string;
  const userProfileId = '64d4b0502e1b7b16a3cf5022';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();

    // Login to get a token for authentication
    const loginResponse = await request(server)
      .post('/users/login')
      .send(adminCredentials());
    token = loginResponse.body.token;
  }, 10000);

  afterAll(async () => {
    await app.close();
  });

  it('/awards (POST) - should create a new award', async () => {
    const createAwardDto = {
      title: 'Translators Dance Crew: Chasing the clout',
      caption:
        'murakoze cyane yari njy mamsj fdhfjhkd k fdjhfd kdksdfhfjsdflsdkf',
      category: 'Singer',
      userProfileId,
      seasonName: 'SEASON_3',
      image:
        'https://cdn.pixabay.com/photo/2023/08/06/17/13/roads-8173354_1280.jpg',
    };

    const response = await request(server)
      .post('/awards')
      .set('authorization', `Bearer ${token}`)
      .send(createAwardDto);

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.userProfileId).toBe(userProfileId);
    expect(response.body.data.featuredPhoto).toBeDefined();
    awardId = response.body.data.id;
    awardImage = response.body.data.featuredPhoto;
  }, 10000);

  it('/awards (GET) - should get all awards', async () => {
    const response = await request(server).get('/awards');

    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.data).toEqual(expect.any(Array));
  });

  it('/awards/:id (GET) - should get a specific award', async () => {
    const response = await request(server).get(`/awards/${awardId}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.userProfileId).toBe(userProfileId);
  });

  it('/awards/profile/:id (GET) - should get awards by profile user Id', async () => {
    const response = await request(server).get(
      `/awards/profile/${userProfileId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.data).toEqual(expect.any(Array));
  });

  it('/awards/certificate/:id (GET) - should download certificate', async () => {
    const response = await request(server).get(
      `/awards/certificate/${awardId}`,
    );
    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.certificateDownloads).toBeDefined();
    expect(response.body.data.certificateDownloads).toBe(4);
    expect(response.body.data.certificateLastDownloadedAt).not.toBeNull();
  });

  it('/awards/:id (PATCH) - should update a specific award', async () => {
    const updateAwardDto = {
      title: 'Fyotofyoto: Chasing the clout',
      category: AwardCategory.Fashion,
      image:
        'https://cdn.pixabay.com/photo/2023/08/06/17/13/roads-8173354_1280.jpg',
    };

    const response = await request(server)
      .patch(`/awards/${awardId}`)
      .set('authorization', `Bearer ${token}`)
      .send(updateAwardDto);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.category).toBe(AwardCategory.Fashion);
    expect(response.body.data.featuredPhoto).toBeDefined();
    expect(response.body.data.featuredPhoto).not.toBe(awardImage);
    expect(response.body.data.userProfileId).toBe(userProfileId);
  });

  it('/awards/:id (DELETE) - should delete a specific award', async () => {
    const response = await request(server)
      .delete(`/awards/${awardId}`)
      .set('authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.userProfileId).toBe(userProfileId);
  });
});
