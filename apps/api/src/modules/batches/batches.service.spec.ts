import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BatchesService } from './batches.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BatchStatus, SubmissionStatus } from '@prisma/client';

describe('BatchesService', () => {
  let service: BatchesService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any;

  const mockCollector = { id: 'col-1', userId: 'user-1' };

  const mockBatch = {
    id: 'batch-1',
    collectorId: 'col-1',
    validatedBy: 'user-1',
    totalRawOilLiter: 0,
    totalCleanOilLiter: 0,
    residueLiter: 0,
    status: BatchStatus.draft,
  };

  const mockBatchWithItems = (actualLiters: number[]) => ({
    ...mockBatch,
    batchItems: actualLiters.map((actualLiter, index) => ({
      id: `bi-${index + 1}`,
      submission: mockSubmission(`sub-${index + 1}`, SubmissionStatus.in_batch, actualLiter),
    })),
  });

  const processedBatch = {
    ...mockBatch,
    totalRawOilLiter: 120,
    totalCleanOilLiter: 100,
    residueLiter: 20,
  };

  const mockSubmission = (
    id: string,
    status: SubmissionStatus,
    actualLiter = 10,
  ) => ({
    id,
    collectorId: 'col-1',
    status,
    actualLiter,
  });

  beforeEach(async () => {
    mockPrisma = {
      collectorProfile: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      batch: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      oilSubmission: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      batchItem: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops.map(() => ({})))),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BatchesService>(BatchesService);
  });

  describe('create', () => {
    it('should create a new batch', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(mockCollector);
      mockPrisma.collectorProfile.create.mockResolvedValue(mockCollector);
      mockPrisma.batch.create.mockResolvedValue(mockBatch);

      const result = await service.create('user-1', {});

      expect(mockPrisma.collectorProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(mockPrisma.batch.create).toHaveBeenCalled();
      expect(result).toEqual(mockBatch);
    });

    it('should create a minimal collector profile if missing', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(null);
      mockPrisma.collectorProfile.create.mockResolvedValue(mockCollector);
      mockPrisma.batch.create.mockResolvedValue(mockBatch);

      await expect(service.create('user-1', {})).resolves.toEqual(mockBatch);
      expect(mockPrisma.collectorProfile.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          latitude: '0',
          longitude: '0',
          warehouseAddress: 'Belum diatur',
          serviceRadiusKm: 0,
          capacityLiter: 0,
        },
      });
    });
  });

  describe('addItems', () => {
    const dto = { submissionIds: ['sub-1', 'sub-2'] };

    it('should add items to a draft batch', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(mockCollector);
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatchWithItems([60, 60]));
      mockPrisma.oilSubmission.findMany.mockResolvedValue([
        mockSubmission('sub-1', SubmissionStatus.picked_up),
        mockSubmission('sub-2', SubmissionStatus.picked_up),
      ]);
      mockPrisma.batchItem.findMany.mockResolvedValue([]);
      mockPrisma.$transaction.mockResolvedValue([{}, {}, {}, {}]);
      mockPrisma.batch.findUnique.mockResolvedValueOnce(mockBatch).mockResolvedValueOnce({
        ...mockBatch,
        batchItems: [],
      });

      const result = await service.addItems('batch-1', 'user-1', dto);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if batch not found', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(mockCollector);
      mockPrisma.batch.findUnique.mockResolvedValue(null);

      await expect(
        service.addItems('batch-1', 'user-1', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if batch not owned by collector', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(mockCollector);
      mockPrisma.batch.findUnique.mockResolvedValue({ ...mockBatch, collectorId: 'other-col' });

      await expect(
        service.addItems('batch-1', 'user-1', dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if batch not in draft status', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(mockCollector);
      mockPrisma.batch.findUnique.mockResolvedValue({ ...mockBatch, status: BatchStatus.sent });

      await expect(
        service.addItems('batch-1', 'user-1', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if submission IDs are invalid', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(mockCollector);
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatchWithItems([60, 60]));
      mockPrisma.oilSubmission.findMany.mockResolvedValue([
        mockSubmission('sub-1', SubmissionStatus.picked_up),
      ]); // only 1 of 2

      await expect(
        service.addItems('batch-1', 'user-1', dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if submission not owned by collector', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(mockCollector);
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatchWithItems([60, 60]));
      mockPrisma.oilSubmission.findMany.mockResolvedValue([
        { ...mockSubmission('sub-1', SubmissionStatus.picked_up), collectorId: 'other-col' },
        mockSubmission('sub-2', SubmissionStatus.picked_up),
      ]);

      await expect(
        service.addItems('batch-1', 'user-1', dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if submission not picked_up', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(mockCollector);
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatchWithItems([100]));
      mockPrisma.oilSubmission.findMany.mockResolvedValue([
        mockSubmission('sub-1', SubmissionStatus.accepted), // not picked_up
        mockSubmission('sub-2', SubmissionStatus.picked_up),
      ]);

      await expect(
        service.addItems('batch-1', 'user-1', dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('process', () => {
    it('should process batch with correct calculations', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(mockCollector);
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatchWithItems([60, 60]));
      mockPrisma.batch.update.mockResolvedValue(processedBatch);

      const result = await service.process('batch-1', 'user-1', {
        rawOil: 120,
        residue: 20,
      });

      expect(mockPrisma.batch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'batch-1' },
          data: expect.objectContaining({
            totalRawOilLiter: 120,
            totalCleanOilLiter: 100,
            residueLiter: 20,
            totalLiter: 100,
          }),
        }),
      );
      expect(result).toEqual(processedBatch);
    });

    it('should throw NotFoundException if batch not found', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(mockCollector);
      mockPrisma.batch.findUnique.mockResolvedValue(null);

      await expect(
        service.process('batch-1', 'user-1', { rawOil: 120, residue: 20 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not the batch owner', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(mockCollector);
      mockPrisma.batch.findUnique.mockResolvedValue({ ...mockBatch, collectorId: 'other-col' });

      await expect(
        service.process('batch-1', 'user-1', { rawOil: 120, residue: 20 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if residue > rawOil', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(mockCollector);
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatchWithItems([100]));

      await expect(
        service.process('batch-1', 'user-1', { rawOil: 10, residue: 20 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle zero residue', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(mockCollector);
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatchWithItems([100]));
      mockPrisma.batch.update.mockResolvedValue({ ...mockBatch, totalRawOilLiter: 100 });

      await service.process('batch-1', 'user-1', { rawOil: 100, residue: 0 });

      expect(mockPrisma.batch.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalRawOilLiter: 100,
            totalCleanOilLiter: 100,
            residueLiter: 0,
            totalLiter: 100,
          }),
        }),
      );
    });
  });

  describe('send', () => {
    it('should mark batch as sent when processed', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(mockCollector);
      mockPrisma.batch.findUnique.mockResolvedValue(processedBatch);
      mockPrisma.batch.update.mockResolvedValue({ ...processedBatch, status: BatchStatus.sent });

      const result = await service.send('batch-1', 'user-1');

      expect(mockPrisma.batch.update).toHaveBeenCalledWith({
        where: { id: 'batch-1' },
        data: { status: BatchStatus.sent },
      });
      expect(result.status).toBe(BatchStatus.sent);
    });

    it('should throw NotFoundException if batch not found', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(mockCollector);
      mockPrisma.batch.findUnique.mockResolvedValue(null);

      await expect(service.send('batch-1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if not the batch owner', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(mockCollector);
      mockPrisma.batch.findUnique.mockResolvedValue({ ...processedBatch, collectorId: 'other-col' });

      await expect(service.send('batch-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if batch not processed', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(mockCollector);
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch); // rawOilLiter = 0

      await expect(service.send('batch-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if already sent', async () => {
      mockPrisma.collectorProfile.findUnique.mockResolvedValue(mockCollector);
      mockPrisma.batch.findUnique.mockResolvedValue({
        ...processedBatch,
        status: BatchStatus.sent,
      });

      await expect(service.send('batch-1', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return batch with full includes', async () => {
      const fullBatch = { ...mockBatch, collector: {}, batchItems: [], validator: {} };
      mockPrisma.batch.findUnique.mockResolvedValue(fullBatch);

      const result = await service.findOne('batch-1');

      expect(result).toEqual(fullBatch);
      expect(mockPrisma.batch.findUnique).toHaveBeenCalledWith({
        where: { id: 'batch-1' },
        include: expect.objectContaining({
          collector: expect.any(Object),
          batchItems: expect.any(Object),
          validator: expect.any(Object),
          labResult: true,
        }),
      });
    });

    it('should throw NotFoundException if batch not found', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(null);

      await expect(service.findOne('batch-1')).rejects.toThrow(NotFoundException);
    });
  });
});
