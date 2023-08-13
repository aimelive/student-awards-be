import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { adminCredentials } from './stubs/users';
import { LoginDto } from '../src/users/dto/login-user.dto';
import { User } from '@prisma/client';

describe('SeasonsController (E2E)', () => {
  let app: INestApplication;
  let server: any;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  const loginUserAndGetToken = async (
    dto: LoginDto,
  ): Promise<{ data: User; token: string; code: number }> => {
    const loginResponse = await request(server).post('/users/login').send(dto);
    return { ...loginResponse.body, code: loginResponse.statusCode };
  };

  describe('Login', () => {
    it('should login the admin', async () => {
      const {
        token: userToken,
        data,
        code,
      } = await loginUserAndGetToken(adminCredentials());
      expect(code).toBe(200);
      expect(userToken).toBeDefined();
      expect(data.id).toBeDefined();
      expect(data).toBeDefined();
      expect(data.email).toBeDefined();
      expect(data.email).toBe(adminCredentials().email);
      token = userToken;
    });
  });

  describe('Seasons/Editions CRUD operation', () => {
    const createSeasonDto = {
      name: 'SEASON_2',
      date: '2021-05-21T16:30:00',
    };
    it('/seasons (POST) - should create a new season', async () => {
      const response = await request(server)
        .post('/seasons')
        .set('authorization', `Bearer ${token}`)
        .send(createSeasonDto);

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(createSeasonDto.name);
    });

    it('/seasons (GET) - should get all seasons', async () => {
      const response = await request(server).get('/seasons');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(expect.any(Array));
    });

    it('/seasons/:name (GET) - should get a specific season', async () => {
      const response = await request(server).get(
        '/seasons/' + createSeasonDto.name,
      );
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(createSeasonDto.name);
    });

    it('/seasons/:name (PATCH) - should update a specific season', async () => {
      const updateSeasonDto = {
        date: '2023-05-21T16:30:00',
      };

      const response = await request(server)
        .patch('/seasons/' + createSeasonDto.name)
        .set('authorization', `Bearer ${token}`)
        .send(updateSeasonDto);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(createSeasonDto.name);
    });

    it('/seasons/:name (DELETE) - should delete a specific season', async () => {
      const response = await request(server)
        .delete('/seasons/' + createSeasonDto.name)
        .set('authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(createSeasonDto.name);
    });
  });
});
