import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { adminCredentials } from './stubs/users';

describe('PerformancesController (E2E)', () => {
  let app: INestApplication;
  let server: any;
  let token: string;
  let performanceId: string;
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

  it('/performances (POST) - should create a new performance', async () => {
    const createPerformanceDto = {
      seasonName: 'SEASON_3',
      images: [
        'https://cdn.pixabay.com/photo/2023/08/06/17/13/roads-8173354_1280.jpg',
        'https://cdn.pixabay.com/photo/2022/03/20/18/33/usa-7081584_1280.jpg',
        'https://cdn.pixabay.com/photo/2019/10/08/19/21/awards-4535861_1280.jpg',
      ],
      videoUrl: 'https://youtu.be/zAeXLFSQRbk',
      duration: '12:54',
      title: 'Translators Dance Crew: Chasing the clout',
      description:
        'murakoze cyane yari njy mamsj fdhfjhkd k fdjhfd kdksdfhfjsdflsdkf',
      userProfileId,
    };

    const response = await request(server)
      .post('/performances')
      .set('authorization', `Bearer ${token}`)
      .send(createPerformanceDto);

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.images).toHaveLength(3);
    performanceId = response.body.data.id;
  }, 10000);

  it('/performances (GET) - should get all performances', async () => {
    const response = await request(server).get('/performances');

    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.data).toEqual(expect.any(Array));
  });

  it('/performances/:id (GET) - should get a specific performance', async () => {
    const response = await request(server).get(
      `/performances/${performanceId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.images).toHaveLength(3);
  });

  it('/performances/addImage/:id (PATCH) - should add performance image', async () => {
    const addImageDto = {
      image:
        'https://cdn.pixabay.com/photo/2023/08/06/17/13/roads-8173354_1280.jpg',
    };

    const response = await request(server)
      .patch(`/performances/addImage/${performanceId}`)
      .set('authorization', `Bearer ${token}`)
      .send(addImageDto);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.images).toHaveLength(4);
    addedImage = response.body.data.images[3];
  });

  it('/performances/removeImage/:id (PATCH) - should remove performance image', async () => {
    const removeImageDto = {
      image: addedImage,
    };

    const response = await request(server)
      .patch(`/performances/removeImage/${performanceId}`)
      .set('authorization', `Bearer ${token}`)
      .send(removeImageDto);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.images).toHaveLength(3);
  });

  it('/performances/profile/:id (GET) - should get performances by profile Id', async () => {
    const response = await request(server).get(
      `/performances/profile/${userProfileId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toBeDefined();
    expect(response.body.data).toEqual(expect.any(Array));
    expect(response.body.data).toHaveLength(1);
  });

  it('/performances/:id (PATCH) - should update a specific performance', async () => {
    const updatePerformanceDto = {
      duration: '13:20',
    };

    const response = await request(server)
      .patch(`/performances/${performanceId}`)
      .set('authorization', `Bearer ${token}`)
      .send(updatePerformanceDto);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.images).toHaveLength(3);
  });

  it('/performances/:id (DELETE) - should delete a specific performance', async () => {
    const response = await request(server)
      .delete(`/performances/${performanceId}`)
      .set('authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.images).toHaveLength(3);
  });
});
