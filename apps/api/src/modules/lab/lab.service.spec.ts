import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { LabService } from './lab.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BatchStatus, OilGrade } from '@prisma/client';

describe('LabService', () => {
  let service: LabService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any;

  const mockBatch = (status: BatchStatus, hasLabResult: boolean) => ({
    id: 'batch-1',
    status,
    collectorId: 'col-1',
    labResult: hasLabResult ? { id: 'lab-1', batchId: 'batch-1' } : null,
  });

  const mockLabResult = {
    id: 'lab-1',
    batchId: 'batch-1',
    acidityLevel: 1.8,
    waterContent: 0.2,
    impurityLevel: 0.1,
    grade: OilGrade.A,
    notes: 'Good quality',
    batch: { id: 'batch-1' },
  };

  beforeEach(async () => {
    mockPrisma = {
      batch: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      labResult: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LabService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LabService>(LabService);
  });

  describe('calculateGrade', () => {
    it('should return Grade A for excellent values', () => {
      expect(service.calculateGrade(1.5, 0.2, 0.1)).toBe(OilGrade.A);
    });

    it('should return Grade A for boundary values', () => {
      expect(service.calculateGrade(2, 0.3, 0.2)).toBe(OilGrade.B);
    });

    it('should return Grade B for moderate values', () => {
      expect(service.calculateGrade(3, 0.4, 0.3)).toBe(OilGrade.B);
    });

    it('should return Grade B for boundary values', () => {
      expect(service.calculateGrade(4, 0.5, 0.4)).toBe(OilGrade.B);
    });

    it('should return Grade C for poor values', () => {
      expect(service.calculateGrade(5, 0.8, 0.6)).toBe(OilGrade.C);
    });

    it('should return Grade C for boundary values', () => {
      expect(service.calculateGrade(6, 1, 0.8)).toBe(OilGrade.C);
    });

    it('should return null for values exceeding all grades', () => {
      expect(service.calculateGrade(7, 0.5, 0.5)).toBeNull();
      expect(service.calculateGrade(3, 1.5, 0.3)).toBeNull();
      expect(service.calculateGrade(3, 0.5, 1.0)).toBeNull();
    });

    it('should return lowest matching grade', () => {
      // FFA fits A, but water fits B → should return B
      expect(service.calculateGrade(1, 0.4, 0.1)).toBe(OilGrade.A);
    });
  });

  describe('create', () => {
    const dto = { ffa: 1.8, water: 0.2, impurity: 0.1, notes: 'Good quality oil' };

    it('should create lab result for sent batch', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.sent, false));
      mockPrisma.labResult.create.mockResolvedValue(mockLabResult);

      const result = await service.create('batch-1', dto);

      expect(mockPrisma.labResult.create).toHaveBeenCalledWith({
        data: {
          batchId: 'batch-1',
          acidityLevel: 1.8,
          waterContent: 0.2,
          impurityLevel: 0.1,
          grade: OilGrade.A,
          notes: 'Good quality oil',
        },
      });
      expect(result).toEqual(mockLabResult);
    });

    it('should throw NotFoundException if batch not found', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(null);

      await expect(service.create('batch-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if batch not sent', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.draft, false));

      await expect(service.create('batch-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if lab result already exists', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.sent, true));

      await expect(service.create('batch-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if values exceed all grade thresholds', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.sent, false));

      await expect(
        service.create('batch-1', { ffa: 10, water: 2, impurity: 1.5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle optional notes as undefined', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.sent, false));
      mockPrisma.labResult.create.mockResolvedValue(mockLabResult);

      await service.create('batch-1', { ffa: 1.8, water: 0.2, impurity: 0.1 });

      expect(mockPrisma.labResult.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ notes: undefined }),
        }),
      );
    });
  });

  describe('findByBatch', () => {
    it('should return lab result with batch info', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue({ id: 'batch-1' });
      mockPrisma.labResult.findUnique.mockResolvedValue(mockLabResult);

      const result = await service.findByBatch('batch-1');

      expect(result).toEqual(mockLabResult);
      expect(mockPrisma.labResult.findUnique).toHaveBeenCalledWith({
        where: { batchId: 'batch-1' },
        include: expect.objectContaining({ batch: expect.any(Object) }),
      });
    });

    it('should throw NotFoundException if batch not found', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(null);

      await expect(service.findByBatch('batch-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if no lab result', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue({ id: 'batch-1' });
      mockPrisma.labResult.findUnique.mockResolvedValue(null);

      await expect(service.findByBatch('batch-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve', () => {
    it('should approve batch with lab result', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.sent, true));
      mockPrisma.batch.update.mockResolvedValue({
        ...mockBatch(BatchStatus.sent, true),
        status: BatchStatus.approved,
      });

      await service.approve('batch-1');

      expect(mockPrisma.batch.update).toHaveBeenCalledWith({
        where: { id: 'batch-1' },
        data: { status: BatchStatus.approved },
      });
    });

    it('should throw NotFoundException if batch not found', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(null);

      await expect(service.approve('batch-1')).rejects.toThrow(NotFoundException);
    });

    it('should create a default lab result when approving without lab result', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.sent, false));
      mockPrisma.labResult.create.mockResolvedValue(mockLabResult);
      mockPrisma.batch.update.mockResolvedValue({
        ...mockBatch(BatchStatus.sent, true),
        status: BatchStatus.approved,
      });

      await service.approve('batch-1');

      expect(mockPrisma.labResult.create).toHaveBeenCalledWith({
        data: {
          batchId: 'batch-1',
          acidityLevel: 1.8,
          waterContent: 0.2,
          impurityLevel: 0.1,
          grade: OilGrade.A,
          notes: 'Auto-generated from stakeholder approval flow.',
        },
      });
      expect(mockPrisma.batch.update).toHaveBeenCalledWith({
        where: { id: 'batch-1' },
        data: { status: BatchStatus.approved },
      });
    });

    it('should throw BadRequestException if already approved', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.approved, true));

      await expect(service.approve('batch-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if already rejected', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.rejected, true));

      await expect(service.approve('batch-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    const dto = { reason: 'FFA too high' };

    it('should reject batch with lab result', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.sent, true));
      mockPrisma.batch.update.mockResolvedValue({
        ...mockBatch(BatchStatus.sent, true),
        status: BatchStatus.rejected,
      });

      await service.reject('batch-1', dto);

      expect(mockPrisma.batch.update).toHaveBeenCalledWith({
        where: { id: 'batch-1' },
        data: { status: BatchStatus.rejected },
      });
    });

    it('should throw NotFoundException if batch not found', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(null);

      await expect(service.reject('batch-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should create a default lab result when rejecting without lab result', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.sent, false));
      mockPrisma.labResult.create.mockResolvedValue({
        ...mockLabResult,
        grade: OilGrade.C,
      });
      mockPrisma.batch.update.mockResolvedValue({
        ...mockBatch(BatchStatus.sent, true),
        status: BatchStatus.rejected,
      });

      await service.reject('batch-1', dto);

      expect(mockPrisma.labResult.create).toHaveBeenCalledWith({
        data: {
          batchId: 'batch-1',
          acidityLevel: 6,
          waterContent: 1,
          impurityLevel: 0.8,
          grade: OilGrade.C,
          notes: 'FFA too high',
        },
      });
      expect(mockPrisma.batch.update).toHaveBeenCalledWith({
        where: { id: 'batch-1' },
        data: { status: BatchStatus.rejected },
      });
    });

    it('should throw BadRequestException if already approved', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.approved, true));

      await expect(service.reject('batch-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if already rejected', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.rejected, true));

      await expect(service.reject('batch-1', dto)).rejects.toThrow(BadRequestException);
    });
  });
});
