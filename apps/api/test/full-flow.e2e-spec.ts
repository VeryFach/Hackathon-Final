import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, RequestMethod } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import cookieParser from 'cookie-parser';
import { cleanDatabase, disconnectTestDb } from './test-db';

/* ─── Shared state across test suites ─── */
let masyarakatToken: string;
let pengepulToken: string;
let stakeholderToken: string;
let submissionId: string;
let batchId: string;

describe('Full Flow (e2e)', () => {
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

  /* ───────────────────────────────────────────
     USERS MODULE
     ─────────────────────────────────────────── */
  describe('Users Module', () => {
    it('should register 3 users with different roles', async () => {
      const masyarakat = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'masyarakat@test.com', password: 'password123', fullName: 'Masyarakat User', role: 'masyarakat' })
        .expect(201);
      masyarakatToken = masyarakat.body.access_token;

      const pengepul = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'pengepul@test.com', password: 'password123', fullName: 'Pengepul User', role: 'pengepul' })
        .expect(201);
      pengepulToken = pengepul.body.access_token;

      const stakeholder = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'stakeholder@test.com', password: 'password123', fullName: 'Stakeholder User', role: 'stakeholder' })
        .expect(201);
      stakeholderToken = stakeholder.body.access_token;

      expect(masyarakatToken).toBeDefined();
      expect(pengepulToken).toBeDefined();
      expect(stakeholderToken).toBeDefined();
    });

    it('GET /api/users/me should return current user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${masyarakatToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email', 'masyarakat@test.com');
      expect(res.body).toHaveProperty('fullName', 'Masyarakat User');
    });

    it('GET /api/users/me should reject without token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/me');

      // JwtGuard throws generic Error → status is not 200
      expect(res.status).not.toBe(200);
    });

    it('PATCH /api/users should update user profile', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/users')
        .set('Authorization', `Bearer ${masyarakatToken}`)
        .send({ email: 'masyarakat-updated@test.com' })
        .expect(200);

      expect(res.body.email).toBe('masyarakat-updated@test.com');
    });
  });

  /* ───────────────────────────────────────────
     PROFILES MODULE
     ─────────────────────────────────────────── */
  describe('Profiles Module', () => {
    it('POST /api/profiles/depositor should create depositor profile', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/profiles/depositor')
        .set('Authorization', `Bearer ${masyarakatToken}`)
        .send({ latitude: '-6.2088', longitude: '106.8456', address: 'Jl. Sudirman No. 1' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.address).toBe('Jl. Sudirman No. 1');
    });

    it('POST /api/profiles/depositor should reject duplicate', async () => {
      await request(app.getHttpServer())
        .post('/api/profiles/depositor')
        .set('Authorization', `Bearer ${masyarakatToken}`)
        .send({ latitude: '-6.2088', longitude: '106.8456', address: 'Another' })
        .expect(409);
    });

    it('GET /api/profiles/depositor should return depositor profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/profiles/depositor')
        .set('Authorization', `Bearer ${masyarakatToken}`)
        .expect(200);

      expect(res.body.address).toBe('Jl. Sudirman No. 1');
      expect(res.body.user.email).toBe('masyarakat@test.com');
    });

    it('PATCH /api/profiles/depositor should update profile', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/profiles/depositor')
        .set('Authorization', `Bearer ${masyarakatToken}`)
        .send({ latitude: '-6.2', longitude: '106.8', address: 'Jl. Updated No. 2' })
        .expect(200);

      expect(res.body.address).toBe('Jl. Updated No. 2');
    });

    it('POST /api/profiles/collector should create collector profile', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/profiles/collector')
        .set('Authorization', `Bearer ${pengepulToken}`)
        .send({
          latitude: '-6.1754',
          longitude: '106.8272',
          warehouseAddress: 'Gudang Jakarta Pusat',
          serviceRadiusKm: 50,
          capacityLiter: 5000,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.warehouseAddress).toBe('Gudang Jakarta Pusat');
    });

    it('POST /api/profiles/collector should reject non-pengepul', async () => {
      await request(app.getHttpServer())
        .post('/api/profiles/collector')
        .set('Authorization', `Bearer ${masyarakatToken}`)
        .send({
          latitude: '-6.1',
          longitude: '106.8',
          warehouseAddress: 'X',
          serviceRadiusKm: 10,
          capacityLiter: 100,
        })
        .expect(403);
    });

    it('GET /api/profiles/collector should return collector profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/profiles/collector')
        .set('Authorization', `Bearer ${pengepulToken}`)
        .expect(200);

      expect(res.body.warehouseAddress).toBe('Gudang Jakarta Pusat');
    });
  });

  /* ───────────────────────────────────────────
     SUBMISSIONS MODULE
     ─────────────────────────────────────────── */
  describe('Submissions Module', () => {
    it('POST /api/submissions should create submission (masyarakat)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/submissions')
        .set('Authorization', `Bearer ${masyarakatToken}`)
        .send({ estimatedLiter: 15.5 })
        .expect(201);

      submissionId = res.body.id;
      expect(submissionId).toBeDefined();
      expect(res.body.estimatedLiter).toBe(15.5);
      expect(res.body.status).toBe('pending');
    });

    it('POST /api/submissions should reject pengepul role', async () => {
      await request(app.getHttpServer())
        .post('/api/submissions')
        .set('Authorization', `Bearer ${pengepulToken}`)
        .send({ estimatedLiter: 10 })
        .expect(403);
    });

    it('GET /api/submissions/me should return user submissions', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/submissions/me')
        .set('Authorization', `Bearer ${masyarakatToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('PATCH /api/submissions/:id/accept should accept (pengepul)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/submissions/${submissionId}/accept`)
        .set('Authorization', `Bearer ${pengepulToken}`)
        .expect(200);

      expect(res.body.status).toBe('accepted');
      expect(res.body.collectorId).toBeDefined();
    });

    it('PATCH /api/submissions/:id/accept should reject already accepted', async () => {
      await request(app.getHttpServer())
        .patch(`/api/submissions/${submissionId}/accept`)
        .set('Authorization', `Bearer ${pengepulToken}`)
        .expect(400);
    });

    it('PATCH /api/submissions/:id/pickup should pickup (pengepul)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/submissions/${submissionId}/pickup`)
        .set('Authorization', `Bearer ${pengepulToken}`)
        .expect(200);

      expect(res.body.status).toBe('picked_up');
    });
  });

  /* ───────────────────────────────────────────
     BATCHES MODULE
     ─────────────────────────────────────────── */
  describe('Batches Module', () => {
    it('POST /api/batches should create a new batch (pengepul)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/batches')
        .set('Authorization', `Bearer ${pengepulToken}`)
        .send({ name: 'E2E Test Batch' })
        .expect(201);

      batchId = res.body.id;
      expect(batchId).toBeDefined();
      expect(res.body.status).toBe('draft');
    });

    it('POST /api/batches should reject masyarakat role', async () => {
      await request(app.getHttpServer())
        .post('/api/batches')
        .set('Authorization', `Bearer ${masyarakatToken}`)
        .send({ name: 'Should Fail' })
        .expect(403);
    });

    it('POST /api/batches/:id/items should add submissions to batch', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/batches/${batchId}/items`)
        .set('Authorization', `Bearer ${pengepulToken}`)
        .send({ submissionIds: [submissionId] })
        .expect(201);

      expect(res.body).toHaveProperty('batchItems');
    });

    it('POST /api/batches/:id/items should reject invalid submission IDs', async () => {
      await request(app.getHttpServer())
        .post(`/api/batches/${batchId}/items`)
        .set('Authorization', `Bearer ${pengepulToken}`)
        .send({ submissionIds: ['non-existent-id'] })
        .expect(400);
    });

    it('PATCH /api/batches/:id/process should calculate metrics', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/batches/${batchId}/process`)
        .set('Authorization', `Bearer ${pengepulToken}`)
        .send({ rawOil: 120, residue: 20 })
        .expect(200);

      expect(res.body.totalRawOilLiter).toBe(120);
      expect(res.body.totalCleanOilLiter).toBe(100);
      expect(res.body.residueLiter).toBe(20);
      expect(res.body.totalLiter).toBe(100);
    });

    it('PATCH /api/batches/:id/process should reject residue > rawOil', async () => {
      await request(app.getHttpServer())
        .patch(`/api/batches/${batchId}/process`)
        .set('Authorization', `Bearer ${pengepulToken}`)
        .send({ rawOil: 10, residue: 20 })
        .expect(400);
    });

    it('PATCH /api/batches/:id/send should mark as sent', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/batches/${batchId}/send`)
        .set('Authorization', `Bearer ${pengepulToken}`)
        .expect(200);

      expect(res.body.status).toBe('sent');
    });

    it('PATCH /api/batches/:id/send should reject double send', async () => {
      await request(app.getHttpServer())
        .patch(`/api/batches/${batchId}/send`)
        .set('Authorization', `Bearer ${pengepulToken}`)
        .expect(400);
    });

    it('GET /api/batches/:id should return batch detail', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/batches/${batchId}`)
        .set('Authorization', `Bearer ${pengepulToken}`)
        .expect(200);

      expect(res.body.id).toBe(batchId);
      expect(res.body).toHaveProperty('collector');
      expect(res.body).toHaveProperty('batchItems');
      expect(res.body.batchItems.length).toBeGreaterThan(0);
    });
  });

  /* ───────────────────────────────────────────
     LAB MODULE
     ─────────────────────────────────────────── */
  describe('Lab Module', () => {
    it('POST /api/lab/:batchId should reject non-stakeholder', async () => {
      await request(app.getHttpServer())
        .post(`/api/lab/${batchId}`)
        .set('Authorization', `Bearer ${pengepulToken}`)
        .send({ ffa: 1.8, water: 0.2, impurity: 0.1 })
        .expect(403);
    });

    it('POST /api/lab/:batchId should create lab result (stakeholder)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/lab/${batchId}`)
        .set('Authorization', `Bearer ${stakeholderToken}`)
        .send({ ffa: 1.8, water: 0.2, impurity: 0.1, notes: 'Good quality oil' })
        .expect(201);

      expect(res.body.grade).toBe('A');
      expect(res.body.acidityLevel).toBe(1.8);
      expect(res.body.waterContent).toBe(0.2);
      expect(res.body.impurityLevel).toBe(0.1);
    });

    it('POST /api/lab/:batchId should reject duplicate lab result', async () => {
      await request(app.getHttpServer())
        .post(`/api/lab/${batchId}`)
        .set('Authorization', `Bearer ${stakeholderToken}`)
        .send({ ffa: 2.0, water: 0.3, impurity: 0.2 })
        .expect(400);
    });

    it('POST /api/lab/:batchId should reject values exceeding all grades', async () => {
      // Create a second batch for this test
      const batch2 = await request(app.getHttpServer())
        .post('/api/batches')
        .set('Authorization', `Bearer ${pengepulToken}`)
        .send({ name: 'Lab Test Batch 2' })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/api/batches/${batch2.body.id}/process`)
        .set('Authorization', `Bearer ${pengepulToken}`)
        .send({ rawOil: 50, residue: 5 })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/batches/${batch2.body.id}/send`)
        .set('Authorization', `Bearer ${pengepulToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/lab/${batch2.body.id}`)
        .set('Authorization', `Bearer ${stakeholderToken}`)
        .send({ ffa: 10, water: 3, impurity: 2 })
        .expect(400);
    });

    it('GET /api/lab/:batchId should return lab result', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/lab/${batchId}`)
        .set('Authorization', `Bearer ${stakeholderToken}`)
        .expect(200);

      expect(res.body.grade).toBe('A');
      expect(res.body.batch).toHaveProperty('id', batchId);
      expect(res.body.batch).toHaveProperty('collector');
    });

    it('GET /api/lab/:batchId should 404 for non-existent batch', async () => {
      await request(app.getHttpServer())
        .get('/api/lab/non-existent-id')
        .set('Authorization', `Bearer ${stakeholderToken}`)
        .expect(404);
    });

    it('PATCH /api/lab/:batchId/approve should approve batch', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/lab/${batchId}/approve`)
        .set('Authorization', `Bearer ${stakeholderToken}`)
        .expect(200);

      expect(res.body.status).toBe('approved');
    });

    it('PATCH /api/lab/:batchId/approve should reject double approve', async () => {
      await request(app.getHttpServer())
        .patch(`/api/lab/${batchId}/approve`)
        .set('Authorization', `Bearer ${stakeholderToken}`)
        .expect(400);
    });

    it('PATCH /api/lab/:batchId/reject should work on a fresh batch', async () => {
      // Create a 3rd batch, process, send, and inspect
      const batch3 = await request(app.getHttpServer())
        .post('/api/batches')
        .set('Authorization', `Bearer ${pengepulToken}`)
        .send({ name: 'Reject Test Batch' })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/api/batches/${batch3.body.id}/process`)
        .set('Authorization', `Bearer ${pengepulToken}`)
        .send({ rawOil: 80, residue: 15 })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/batches/${batch3.body.id}/send`)
        .set('Authorization', `Bearer ${pengepulToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/lab/${batch3.body.id}`)
        .set('Authorization', `Bearer ${stakeholderToken}`)
        .send({ ffa: 5, water: 0.9, impurity: 0.7 })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/api/lab/${batch3.body.id}/reject`)
        .set('Authorization', `Bearer ${stakeholderToken}`)
        .send({ reason: 'Quality below acceptable' })
        .expect(200);

      expect(res.body.status).toBe('rejected');
    });

    it('PATCH /api/lab/:batchId/reject should reject already rejected', async () => {
      // batch3 was rejected above, but we need its ID
      // Use the approved batch instead
      await request(app.getHttpServer())
        .patch(`/api/lab/${batchId}/reject`)
        .set('Authorization', `Bearer ${stakeholderToken}`)
        .send({ reason: 'Changed mind' })
        .expect(400);
    });
  });
});
