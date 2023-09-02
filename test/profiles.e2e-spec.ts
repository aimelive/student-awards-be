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
    }, 10000);
  });

  describe('GET Profiles', () => {
    let createdProfileId: string;
    let createdUserId: string;

    it('should get profiles when authenticated', async () => {
      const response = await request(server)
        .get('/profile')
        .set('authorization', `Bearer ${token}`);
      expect(response.statusCode).toBe(200);
      expect(response.body.data).toEqual(expect.any(Array));
    });

    it('should create a new user and return status code 201', async () => {
      const response = await request(server)
        .post('/users')
        .set('authorization', `Bearer ${token}`)
        .send({
          firstName: 'Aime',
          lastName: 'Ndayambaje',
          email: 'aimelive2030@gmail.com',
        });

      expect(response.statusCode).toBe(201);
      expect(response.body.data.id).toBeDefined();
      createdUserId = response.body.data.id;
    });

    it('should not get profile by Id', async () => {
      const response = await request(server)
        .get('/profile/user/' + createdUserId)
        .set('authorization', `Bearer ${token}`);
      expect(response.statusCode).toBe(404);
    });

    it('should create the user profile', async () => {
      const response = await request(server)
        .post('/profile/' + createdUserId)
        .set('authorization', `Bearer ${token}`)
        .send({
          username: 'aimelive2030',
          image:
            'https://www.peregrine-bryant.co.uk/img/uploadsfiles/2018/05/placeholder-test.png',
          phoneNumber: '0786385773',
          bio: 'The best rapper you should know',
        });
      expect(response.statusCode).toBe(201);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.userId).toBe(createdUserId);
      expect(response.body.data.phoneNumber).toEqual('0786385773');
      createdProfileId = response.body.data.id;
    }, 10000);

    it('should update the created user profile', async () => {
      const response = await request(server)
        .patch(`/profile/${createdUserId}`)
        .set('authorization', `Bearer ${token}`)
        .send({
          username: 'aimeliveMubi',
          image:
            'https://www.peregrine-bryant.co.uk/img/uploadsfiles/2018/05/placeholder-test.png',
          phoneNumber: '0786385775',
        });
      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.userId).toEqual(createdUserId);
      expect(response.body.data.username).toEqual('aimeliveMubi');
      expect(response.body.data.phoneNumber).toEqual('0786385775');
      expect(response.body.data.profilePic).toBeDefined();
    });

    it('should get profile by Id', async () => {
      const response = await request(server).get(
        '/profile/user/' + createdUserId,
      );
      expect(response.statusCode).toBe(200);
      expect(response.body.data.userId).toEqual(createdUserId);
      expect(response.body.data.username).toEqual('aimeliveMubi');
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
      expect(response.body.data.userId).toEqual(createdUserId);
      expect(response.body.data.id).toEqual(createdProfileId);
    });

    it('should delete created user', async () => {
      const response = await request(server)
        .delete(`/users/${createdUserId}`)
        .set('authorization', `Bearer ${token}`);
      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toEqual('User deleted successfully!');
      expect(response.body.data.email).toEqual('aimelive2030@gmail.com');
      expect(response.body.data.id).toEqual(createdUserId);
    });
  });
});
