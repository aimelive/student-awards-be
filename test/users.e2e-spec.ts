import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { LoginDto } from '../src/users/dto/login-user.dto';
import { adminCredentials } from './stubs/users';

describe('UsersController', () => {
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

  const loginUserAndGetToken = async (dto: LoginDto) => {
    const loginResponse = await request(server).post('/users/login').send(dto);
    return loginResponse.body.token;
  };

  describe('Login', () => {
    it('should login the user and return a token', async () => {
      token = await loginUserAndGetToken(adminCredentials());
      expect(token).toBeDefined();
    });
  });

  describe('GET Users', () => {
    let createdUserId: string;
    let updatedUserLoginToken: string;

    const createUserDto = {
      firstName: 'Aime',
      lastName: 'Ndayambaje',
      email: 'aimelive250@gmail.com',
      password: 'Umuhungu@123',
    };

    beforeAll(async () => {
      token = await loginUserAndGetToken(adminCredentials());
    });

    it('should get users when authenticated', async () => {
      const response = await request(server)
        .get('/users')
        .set('authorization', `Bearer ${token}`);
      expect(response.statusCode).toBe(200);
    });

    it('should create a new user and return status code 201', async () => {
      const response = await request(server)
        .post('/users')
        .set('authorization', `Bearer ${token}`)
        .send(createUserDto);

      expect(response.statusCode).toBe(201);
      expect(response.body.data.id).toBeDefined();
      createdUserId = response.body.data.id;
    });

    it('should get a specific user by ID when authenticated', async () => {
      const response = await request(server)
        .get(`/users/${createdUserId}`)
        .set('authorization', `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toEqual(createUserDto.email);
      expect(response.body.data.profile).toBeDefined();
      expect(response.body.data.profile).toBeNull();
    });

    it('should not login user not verified', async () => {
      const response = await request(server)
        .post('/users/login')
        .send({ email: createUserDto.email, password: createUserDto.password });

      expect(response.statusCode).toBe(403);
      expect(response.body.data).toBeUndefined();
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toEqual('Account not verified');
    });

    it('should not login user not found', async () => {
      const response = await request(server).post('/users/login').send({
        email: 'amatayahiye@gmail.com',
        password: createUserDto.password,
      });

      expect(response.statusCode).toBe(404);
      expect(response.body.data).toBeUndefined();
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toEqual(
        'Account with this email does not exist.',
      );
    });

    it('should update the created user', async () => {
      const response = await request(server)
        .patch(`/users/${createdUserId}`)
        .set('authorization', `Bearer ${token}`)
        .send({
          email: 'newuser@gmail.com',
          verified: true,
          status: 'ACTIVE',
        });
      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toEqual('newuser@gmail.com');
      expect(response.body.data.verified).toBe(true);
    });

    it('should be logged in successfully', async () => {
      const response = await request(server).post('/users/login').send({
        email: 'newuser@gmail.com',
        password: createUserDto.password,
      });
      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.id).toEqual(createdUserId);
      expect(response.body.token).toBeDefined();
      updatedUserLoginToken = response.body.token;
    });

    it('should not delete this user', async () => {
      const response = await request(server)
        .delete(`/users/${createdUserId}`)
        .set('authorization', `Bearer ${updatedUserLoginToken}`);
      expect(response.statusCode).toBe(403);
      expect(response.body.data).toBeUndefined();
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toContain('Access denied, you must be');
    });

    it('should delete created user', async () => {
      const response = await request(server)
        .delete(`/users/${createdUserId}`)
        .set('authorization', `Bearer ${token}`);
      expect(response.statusCode).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.message).toBeDefined();
      expect(response.body.message).toEqual('User deleted successfully!');
      expect(response.body.data.email).toEqual('newuser@gmail.com');
      expect(response.body.data.id).toEqual(createdUserId);
    });
  });
});
