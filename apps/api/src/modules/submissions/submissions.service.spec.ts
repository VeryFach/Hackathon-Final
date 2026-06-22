import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubmissionStatus } from '@prisma/client';

// ── Mock Prisma ──────────────────────────────────────────────────────────────
const mockPrisma = {
  depositorProfile: { findUnique: jest.fn() },
  collectorProfile: { findUnique: jest.fn() },
  oilSubmission: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  batch: { findUnique: jest.fn() },
  batchItem: { create: jest.fn(), findUnique: jest.fn() },
  $transaction: jest.fn(),
};

// ── Factories ────────────────────────────────────────────────────────────────
function makeDepositorProfile(overrides: Record<string, unknown> = {}) {
  return { id: 'dep-1', userId: 'user-1', latitude: '-7.25', longitude: '112.75', address: 'Addr', ...overrides };
}

function makeCollectorProfile(overrides: Record<string, unknown> = {}) {
  return { id: 'col-1', userId: 'user-2', latitude: '-7.25', longitude: '112.75', warehouseAddress: 'WH', serviceRadiusKm: 10, capacityLiter: 5000, ...overrides };
}

function makeSubmission(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sub-1',
    estimatedLiter: 10,
    actualLiter: null,
    status: SubmissionStatus.pending,
    depositorId: 'dep-1',
    collectorId: 'col-1',
    createdAt: new Date(),
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────
describe('SubmissionsService', () => {
  let service: SubmissionsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Default successful mock returns
    mockPrisma.depositorProfile.findUnique.mockResolvedValue(makeDepositorProfile());
    mockPrisma.collectorProfile.findUnique.mockResolvedValue(makeCollectorProfile());
    mockPrisma.oilSubmission.findUnique.mockResolvedValue(makeSubmission());
    mockPrisma.batch.findUnique.mockResolvedValue({ id: 'batch-1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SubmissionsService>(SubmissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // create()
  // ──────────────────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('should create a submission with PENDING status', async () => {
      const submission = makeSubmission();
      mockPrisma.oilSubmission.create.mockResolvedValue(submission);

      const result = await service.create('user-1', { estimatedLiter: 10 });

      expect(mockPrisma.depositorProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(mockPrisma.oilSubmission.create).toHaveBeenCalledWith({
        data: {
          estimatedLiter: 10,
          depositorId: 'dep-1',
          status: SubmissionStatus.pending,
        },
      });
      expect(result).toEqual(submission);
    });

    it('should throw NotFoundException if depositor profile not found', async () => {
      mockPrisma.depositorProfile.findUnique.mockResolvedValue(null);

      await expect(service.create('no-user', { estimatedLiter: 10 }))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // findMine()
  // ──────────────────────────────────────────────────────────────────────────
  describe('findMine()', () => {
    it('should return submissions for the current user ordered by latest', async () => {
      const submissions = [makeSubmission(), makeSubmission({ id: 'sub-2' })];
      mockPrisma.oilSubmission.findMany.mockResolvedValue(submissions);

      const result = await service.findMine('user-1');

      expect(mockPrisma.oilSubmission.findMany).toHaveBeenCalledWith({
        where: { depositorId: 'dep-1' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException if depositor profile not found', async () => {
      mockPrisma.depositorProfile.findUnique.mockResolvedValue(null);

      await expect(service.findMine('no-user'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // accept()
  // ──────────────────────────────────────────────────────────────────────────
  describe('accept()', () => {
    it('should accept a pending submission and assign collector', async () => {
      const updated = makeSubmission({ status: SubmissionStatus.accepted, collectorId: 'col-1' });
      mockPrisma.oilSubmission.update.mockResolvedValue(updated);

      const result = await service.accept('sub-1', 'user-2');

      expect(mockPrisma.oilSubmission.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { collectorId: 'col-1', status: SubmissionStatus.accepted },
      });
      expect(result.status).toBe(SubmissionStatus.accepted);
    });

    it('should throw NotFoundException if submission does not exist', async () => {
      mockPrisma.oilSubmission.findUnique.mockResolvedValue(null);

      await expect(service.accept('no-sub', 'user-2'))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if status is not PENDING', async () => {
      mockPrisma.oilSubmission.findUnique.mockResolvedValue(
        makeSubmission({ status: SubmissionStatus.accepted }),
      );

      await expect(service.accept('sub-1', 'user-2'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if collector profile not found', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(null);

      await expect(service.accept('sub-1', 'no-col'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // pickup()
  // ──────────────────────────────────────────────────────────────────────────
  describe('pickup()', () => {
    it('should pickup an accepted submission', async () => {
      mockPrisma.oilSubmission.findUnique.mockResolvedValue(
        makeSubmission({ status: SubmissionStatus.accepted, collectorId: 'col-1' }),
      );
      const updated = makeSubmission({ status: SubmissionStatus.picked_up });
      mockPrisma.oilSubmission.update.mockResolvedValue(updated);

      const result = await service.pickup('sub-1', 'user-2');

      expect(mockPrisma.oilSubmission.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { status: SubmissionStatus.picked_up },
      });
      expect(result.status).toBe(SubmissionStatus.picked_up);
    });

    it('should throw BadRequestException if status is not ACCEPTED', async () => {
      mockPrisma.oilSubmission.findUnique.mockResolvedValue(
        makeSubmission({ status: SubmissionStatus.pending }),
      );

      await expect(service.pickup('sub-1', 'user-2'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if collector is not the assignee', async () => {
      mockPrisma.oilSubmission.findUnique.mockResolvedValue(
        makeSubmission({ status: SubmissionStatus.accepted, collectorId: 'other-col' }),
      );

      await expect(service.pickup('sub-1', 'user-2'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if submission does not exist', async () => {
      mockPrisma.oilSubmission.findUnique.mockResolvedValue(null);

      await expect(service.pickup('no-sub', 'user-2'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // markInBatch()
  // ──────────────────────────────────────────────────────────────────────────
  describe('markInBatch()', () => {
    it('should assign submission to batch via transaction', async () => {
      mockPrisma.oilSubmission.findUnique.mockResolvedValue(
        makeSubmission({ status: SubmissionStatus.picked_up, collectorId: 'col-1' }),
      );
      const batchItem = { id: 'bi-1', batchId: 'batch-1', submissionId: 'sub-1' };
      const updated = makeSubmission({ status: SubmissionStatus.in_batch });
      mockPrisma.batch.findUnique.mockResolvedValue({
        id: 'batch-1',
        collectorId: 'col-1',
        status: 'draft',
      });
      mockPrisma.batchItem.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockResolvedValue([batchItem, updated]);

      const result = await service.markInBatch('sub-1', 'user-2', { batchId: 'batch-1' });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result.status).toBe(SubmissionStatus.in_batch);
    });

    it('should throw BadRequestException if status is not PICKED_UP', async () => {
      mockPrisma.oilSubmission.findUnique.mockResolvedValue(
        makeSubmission({ status: SubmissionStatus.accepted, collectorId: 'col-1' }),
      );

      await expect(service.markInBatch('sub-1', 'user-2', { batchId: 'batch-1' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if collector is not the assignee', async () => {
      mockPrisma.oilSubmission.findUnique.mockResolvedValue(
        makeSubmission({ status: SubmissionStatus.picked_up, collectorId: 'other-col' }),
      );

      await expect(service.markInBatch('sub-1', 'user-2', { batchId: 'batch-1' }))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if batch does not exist', async () => {
      mockPrisma.oilSubmission.findUnique.mockResolvedValue(
        makeSubmission({ status: SubmissionStatus.picked_up, collectorId: 'col-1' }),
      );
      mockPrisma.batch.findUnique.mockResolvedValue(null);

      await expect(service.markInBatch('sub-1', 'user-2', { batchId: 'no-batch' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if submission does not exist', async () => {
      mockPrisma.oilSubmission.findUnique.mockResolvedValue(null);

      await expect(service.markInBatch('no-sub', 'user-2', { batchId: 'batch-1' }))
        .rejects.toThrow(NotFoundException);
    });
  });
});
