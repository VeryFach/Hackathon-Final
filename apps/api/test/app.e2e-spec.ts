import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, RequestMethod } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import cookieParser from 'cookie-parser';
import { cleanDatabase, disconnectTestDb } from './test-db';

describe('App Health (e2e)', () => {
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

  it('GET / should return 200', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200);
  });

  it('POST /api/auth/register without body should return 400', () => {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send({})
      .expect(400);
  });
});
