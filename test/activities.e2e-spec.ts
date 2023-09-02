import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { adminCredentials } from './stubs/users';

describe('ActivitiesController (E2E)', () => {
  let app: INestApplication;
  let server: any;
  let token: string;
  let activityId: string;
  let addedImage: string;
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

  it('/activities (POST) - should create a new activity', async () => {
    const createActivityDto = {
      images: [
        'https://cdn.pixabay.com/photo/2023/08/06/17/13/roads-8173354_1280.jpg',
        'https://cdn.pixabay.com/photo/2022/03/20/18/33/usa-7081584_1280.jpg',
        'https://cdn.pixabay.com/photo/2019/10/08/19/21/awards-4535861_1280.jpg',
      ],
      title: 'Translators Dance Crew: Chasing the clout',
      caption:
        'murakoze cyane yari njy mamsj fdhfjhkd k fdjhfd kdksdfhfjsdflsdkf',
      userProfileId,
    };

    const response = await request(server)
      .post('/activities')
      .set('authorization', `Bearer ${token}`)
      .send(createActivityDto);

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.images).toHaveLength(3);
    activityId = response.body.data.id;
  }, 10000);

  it('/activities (GET) - should get all activities', async () => {
    const response = await request(server).get('/activities');

    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.data).toEqual(expect.any(Array));
  });

  it('/activities/:id (GET) - should get a specific activity', async () => {
    const response = await request(server).get(`/activities/${activityId}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.images).toHaveLength(3);
  });

  it('/activities/profile/:id (GET) - should get activities by profile Id', async () => {
    const response = await request(server).get(
      `/activities/profile/${userProfileId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.data).toEqual(expect.any(Array));
    expect(response.body.data).toHaveLength(1);
  });

  it('/activities/addImage/:id (PATCH) - should add activity image', async () => {
    const addImageDto = {
      image:
        'https://cdn.pixabay.com/photo/2023/08/06/17/13/roads-8173354_1280.jpg',
    };

    const response = await request(server)
      .patch(`/activities/addImage/${activityId}`)
      .set('authorization', `Bearer ${token}`)
      .send(addImageDto);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.images).toHaveLength(4);
    addedImage = response.body.data.images[3];
  }, 10000);

  it('/activities/removeImage/:id (PATCH) - should remove activity image', async () => {
    const removeImageDto = {
      image: addedImage,
    };

    const response = await request(server)
      .patch(`/activities/removeImage/${activityId}`)
      .set('authorization', `Bearer ${token}`)
      .send(removeImageDto);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.images).toHaveLength(3);
  }, 10000);

  it('/activities/:id (PATCH) - should update a specific activity', async () => {
    const updateActivityDto = {
      title: 'Translators Dance Crew: Chasing the clout',
    };

    const response = await request(server)
      .patch(`/activities/${activityId}`)
      .set('authorization', `Bearer ${token}`)
      .send(updateActivityDto);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.images).toHaveLength(3);
  });

  it('/activities/:id (DELETE) - should delete a specific activity', async () => {
    const response = await request(server)
      .delete(`/activities/${activityId}`)
      .set('authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.images).toHaveLength(3);
    expect(response.body.data.userProfileId).toBe(userProfileId);
  });
});
