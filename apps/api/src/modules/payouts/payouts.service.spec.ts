import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PayoutsService } from './payouts.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PayoutStatus } from '@prisma/client';

describe('PayoutsService', () => {
  let service: PayoutsService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any;

  const mockSubmissionWithBatch = (
    actualLiter: number | null,
    hasPayout: boolean,
    totalRawOil: number,
    totalValue: number,
  ) => ({
    id: 'sub-1',
    actualLiter,
    estimatedLiter: 10,
    status: 'in_batch',
    depositorId: 'dep-1',
    payout: hasPayout ? { id: 'pay-1', submissionId: 'sub-1', amount: 50000, status: PayoutStatus.pending } : null,
    batchItems: [
      {
        id: 'bi-1',
        submissionId: 'sub-1',
        batchId: 'batch-1',
        batch: {
          id: 'batch-1',
          totalRawOilLiter: totalRawOil,
          totalCleanOilLiter: totalRawOil * 0.85,
          status: 'approved',
          batchPricing: totalValue > 0
            ? {
                id: 'bp-1',
                batchId: 'batch-1',
                totalValue,
                finalPricePerLiter: totalValue / (totalRawOil * 0.85),
              }
            : null,
        },
      },
    ],
  });

  const mockPayout = (status: PayoutStatus) => ({
    id: 'pay-1',
    submissionId: 'sub-1',
    amount: 50000,
    status,
    paidAt: status === PayoutStatus.paid ? new Date() : null,
  });

  beforeEach(async () => {
    mockPrisma = {
      payout: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      oilSubmission: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      depositorProfile: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayoutsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PayoutsService>(PayoutsService);
  });

  describe('create', () => {
    it('should create payout with correct proportional amount', async () => {
      // actualLiter=10, totalRawOil=100, totalValue=1000000
      // ratio = 10/100 = 0.1, amount = 1000000 * 0.1 = 100000
      mockPrisma.oilSubmission.findUnique.mockResolvedValue(
        mockSubmissionWithBatch(10, false, 100, 1000000),
      );
      mockPrisma.payout.create.mockResolvedValue({
        id: 'pay-1',
        submissionId: 'sub-1',
        amount: 100000,
        status: PayoutStatus.pending,
      });

      const result = await service.create('sub-1');

      expect(mockPrisma.payout.create).toHaveBeenCalledWith({
        data: {
          submissionId: 'sub-1',
          amount: 100000,
          status: PayoutStatus.pending,
        },
      });
      expect(result.amount).toBe(100000);
    });

    it('should throw NotFoundException if submission not found', async () => {
      mockPrisma.oilSubmission.findUnique.mockResolvedValue(null);

      await expect(service.create('sub-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if payout already exists', async () => {
      mockPrisma.oilSubmission.findUnique.mockResolvedValue(
        mockSubmissionWithBatch(10, true, 100, 1000000),
      );

      await expect(service.create('sub-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if actualLiter is null', async () => {
      mockPrisma.oilSubmission.findUnique.mockResolvedValue(
        mockSubmissionWithBatch(null, false, 100, 1000000),
      );

      await expect(service.create('sub-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if actualLiter is 0', async () => {
      mockPrisma.oilSubmission.findUnique.mockResolvedValue(
        mockSubmissionWithBatch(0, false, 100, 1000000),
      );

      await expect(service.create('sub-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no batchItems', async () => {
      const submission = mockSubmissionWithBatch(10, false, 100, 1000000);
      submission.batchItems = [];
      mockPrisma.oilSubmission.findUnique.mockResolvedValue(submission);

      await expect(service.create('sub-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no batch pricing', async () => {
      mockPrisma.oilSubmission.findUnique.mockResolvedValue(
        mockSubmissionWithBatch(10, false, 100, 0),
      );

      await expect(service.create('sub-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if totalRawOilLiter is 0', async () => {
      const submission = mockSubmissionWithBatch(10, false, 0, 1000000);
      submission.batchItems[0].batch.totalRawOilLiter = 0;
      mockPrisma.oilSubmission.findUnique.mockResolvedValue(submission);

      await expect(service.create('sub-1')).rejects.toThrow(BadRequestException);
    });

    it('should calculate full ratio when actualLiter equals totalRawOil', async () => {
      mockPrisma.oilSubmission.findUnique.mockResolvedValue(
        mockSubmissionWithBatch(100, false, 100, 1000000),
      );
      mockPrisma.payout.create.mockResolvedValue({
        id: 'pay-1',
        submissionId: 'sub-1',
        amount: 1000000,
        status: PayoutStatus.pending,
      });

      const result = await service.create('sub-1');

      expect(mockPrisma.payout.create).toHaveBeenCalledWith({
        data: {
          submissionId: 'sub-1',
          amount: 1000000,
          status: PayoutStatus.pending,
        },
      });
      expect(result.amount).toBe(1000000);
    });
  });

  describe('pay', () => {
    it('should mark payout as paid', async () => {
      mockPrisma.payout.findUnique.mockResolvedValue(mockPayout(PayoutStatus.pending));
      mockPrisma.payout.update.mockResolvedValue(mockPayout(PayoutStatus.paid));
      mockPrisma.oilSubmission.update.mockResolvedValue({ id: 'sub-1', status: 'completed' });

      const result = await service.pay('pay-1');

      expect(mockPrisma.payout.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: expect.objectContaining({
          status: PayoutStatus.paid,
          paidAt: expect.any(Date),
        }),
      });
      expect(mockPrisma.oilSubmission.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { status: 'completed' },
      });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result.status).toBe(PayoutStatus.paid);
    });

    it('should throw NotFoundException if payout not found', async () => {
      mockPrisma.payout.findUnique.mockResolvedValue(null);

      await expect(service.pay('pay-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already paid', async () => {
      mockPrisma.payout.findUnique.mockResolvedValue(mockPayout(PayoutStatus.paid));

      await expect(service.pay('pay-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findMine', () => {
    it('should return payouts for authenticated depositor', async () => {
      const payouts = [mockPayout(PayoutStatus.pending)];
      mockPrisma.depositorProfile.findUnique.mockResolvedValue({ id: 'dep-1', userId: 'user-1' });
      mockPrisma.payout.findMany.mockResolvedValue(payouts);

      const result = await service.findMine('user-1');

      expect(mockPrisma.payout.findMany).toHaveBeenCalledWith({
        where: {
          submission: {
            depositorId: 'dep-1',
          },
        },
        include: expect.objectContaining({
          submission: expect.any(Object),
        }),
        orderBy: {
          submission: {
            createdAt: 'desc',
          },
        },
      });
      expect(result).toEqual(payouts);
    });

    it('should throw NotFoundException if depositor profile not found', async () => {
      mockPrisma.depositorProfile.findUnique.mockResolvedValue(null);

      await expect(service.findMine('user-1')).rejects.toThrow(NotFoundException);
    });

    it('should return empty array if no payouts exist', async () => {
      mockPrisma.depositorProfile.findUnique.mockResolvedValue({ id: 'dep-1', userId: 'user-1' });
      mockPrisma.payout.findMany.mockResolvedValue([]);

      const result = await service.findMine('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return all payouts with relations', async () => {
      const payouts = [mockPayout(PayoutStatus.pending), mockPayout(PayoutStatus.paid)];
      mockPrisma.payout.findMany.mockResolvedValue(payouts);

      const result = await service.findAll();

      expect(mockPrisma.payout.findMany).toHaveBeenCalledWith({
        include: expect.objectContaining({
          submission: expect.any(Object),
        }),
        orderBy: {
          submission: {
            createdAt: 'desc',
          },
        },
      });
      expect(result).toEqual(payouts);
    });
  });
});
