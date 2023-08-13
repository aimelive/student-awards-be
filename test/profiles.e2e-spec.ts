import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { LoginDto } from '../src/users/dto/login-user.dto';
import * as request from 'supertest';
import { User } from '@prisma/client';
import { adminCredentials } from './stubs/users';

describe('ProfileController', () => {
  let app: INestApplication;
  let server: any;
  let user: User;
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
      user = data;
    });
  });

  describe('GET Profiles', () => {
    let createdProfileId: string;
    it('should get profiles when authenticated', async () => {
      const response = await request(server)
        .get('/profile')
        .set('authorization', `Bearer ${token}`);
      expect(response.statusCode).toBe(200);
      expect(response.body.data).toEqual(expect.any(Array));
    });

    it('should get profile by Id', async () => {
      const response = await request(server)
        .get('/profile/user/' + user.id)
        .set('authorization', `Bearer ${token}`);
      expect(response.statusCode).toBe(404);
    });

    it('should create the user profile', async () => {
      const response = await request(server)
        .post('/profile/' + user.id)
        .set('authorization', `Bearer ${token}`)
        .send({
          username: 'aimelive250',
          image:
            'https://www.peregrine-bryant.co.uk/img/uploadsfiles/2018/05/placeholder-test.png',
          phoneNumber: '0786385773',
          bio: 'The best rapper you should know',
        });
      expect(response.statusCode).toBe(201);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.userId).toBe(user.id);
      expect(response.body.data.phoneNumber).toEqual('0786385773');
      createdProfileId = response.body.data.id;
    });

    it('should update the created user profile', async () => {
      const response = await request(server)
        .patch(`/profile/${user.id}`)
        .set('authorization', `Bearer ${token}`)
        .send({
          username: 'aimelive',
          image:
            'https://www.peregrine-bryant.co.uk/img/uploadsfiles/2018/05/placeholder-test.png',
          phoneNumber: '0786385775',
        });
      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.userId).toEqual(user.id);
      expect(response.body.data.username).toEqual('aimelive');
      expect(response.body.data.phoneNumber).toEqual('0786385775');
      expect(response.body.data.profilePic).toBeDefined();
    });

    it('should get profile by Id', async () => {
      const response = await request(server).get('/profile/user/' + user.id);
      expect(response.statusCode).toBe(200);
      expect(response.body.data.userId).toEqual(user.id);
      expect(response.body.data.username).toEqual('aimelive');
      expect(response.body.data.phoneNumber).toEqual('0786385775');
    });

    it('should delete created profile', async () => {
      const response = await request(server)
        .delete(`/profile/${createdProfileId}`)
        .set('authorization', `Bearer ${token}`);
      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toEqual('Profile deleted successfully!');
      expect(response.body.data.phoneNumber).toEqual('0786385775');
      expect(response.body.data.userId).toEqual(user.id);
      expect(response.body.data.id).toEqual(createdProfileId);
    });
  });
});
