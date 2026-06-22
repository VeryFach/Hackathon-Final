import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, RequestMethod } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import cookieParser from 'cookie-parser';
import { cleanDatabase, disconnectTestDb } from './test-db';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await cleanDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api', {
      exclude: [{ path: '', method: RequestMethod.GET }],
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await cleanDatabase();
    await app.close();
    await disconnectTestDb();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and return access_token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'auth-test@example.com',
          password: 'password123',
          fullName: 'Auth Tester',
        })
        .expect(201);

      expect(res.body).toHaveProperty('access_token');
      expect(typeof res.body.access_token).toBe('string');
      expect(res.body.access_token.length).toBeGreaterThan(0);
    });

    it('should set authentication cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'auth-cookie@example.com',
          password: 'password123',
          fullName: 'Cookie Test',
        })
        .expect(201);

      const rawCookies = res.headers['set-cookie'];
      expect(rawCookies).toBeDefined();
      const cookieStr = Array.isArray(rawCookies) ? rawCookies.join(';') : String(rawCookies);
      expect(cookieStr).toContain('cookie_token');
    });

    it('should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password456',
        })
        .expect(403);
    });

    it('should reject invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should reject short password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'short-pw@example.com',
          password: '123',
        })
        .expect(400);
    });

    it('should register with specific role', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'pengepul@example.com',
          password: 'password123',
          fullName: 'Pengepul User',
          role: 'pengepul',
        })
        .expect(201);

      expect(res.body).toHaveProperty('access_token');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'login-test@example.com',
          password: 'password123',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(res.body).toHaveProperty('access_token');
    });

    it('should reject invalid password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'wrong-password',
        })
        .expect(403);
    });

    it('should reject non-existent email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(403);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear authentication cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(200);

      expect(res.body).toEqual({ message: 'Logged out successfully' });
    });
  });
});
