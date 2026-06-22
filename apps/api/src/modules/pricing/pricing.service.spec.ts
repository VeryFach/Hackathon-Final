import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PricingService } from './pricing.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BatchStatus, OilGrade } from '@prisma/client';

describe('PricingService', () => {
  let service: PricingService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any;

  const mockPricing = (active: boolean) => ({
    id: 'pricing-1',
    createdBy: 'user-1',
    active,
    createdAt: new Date(),
  });

  const mockGradeRule = (grade: OilGrade, basePrice: number, qualityFactor: number) => ({
    id: `gr-${grade}`,
    pricingId: 'pricing-1',
    grade,
    basePrice,
    qualityFactor,
  });

  const mockVolumeRule = (min: number, max: number | null, bonusFactor: number) => ({
    id: `vr-${min}-${max}`,
    pricingId: 'pricing-1',
    minVolume: min,
    maxVolume: max,
    bonusFactor,
  });

  const mockBatch = (status: BatchStatus, cleanOil: number, hasPricing: boolean) => ({
    id: 'batch-1',
    status,
    collectorId: 'col-1',
    validatedBy: 'user-1',
    totalRawOilLiter: 120,
    totalCleanOilLiter: cleanOil,
    residueLiter: 20,
    totalLiter: cleanOil,
    batchPricing: hasPricing ? { id: 'bp-1', batchId: 'batch-1' } : null,
  });

  beforeEach(async () => {
    mockPrisma = {
      pricing: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      gradeRule: {
        create: jest.fn(),
      },
      volumeRule: {
        create: jest.fn(),
      },
      batch: {
        findUnique: jest.fn(),
      },
      labResult: {
        findUnique: jest.fn(),
      },
      batchPricing: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
  });

  describe('create', () => {
    it('should create pricing config as inactive', async () => {
      const expected = mockPricing(false);
      mockPrisma.pricing.create.mockResolvedValue(expected);

      const result = await service.create('user-1', {});

      expect(mockPrisma.pricing.create).toHaveBeenCalledWith({
        data: { createdBy: 'user-1', active: false },
      });
      expect(result).toEqual(expected);
    });

    it('should accept optional name and basePrice in DTO', async () => {
      mockPrisma.pricing.create.mockResolvedValue(mockPricing(false));

      await service.create('user-1', { name: 'June 2026', basePrice: 8000 });

      expect(mockPrisma.pricing.create).toHaveBeenCalledWith({
        data: { createdBy: 'user-1', active: false },
      });
    });
  });

  describe('addGradeRule', () => {
    const dto = { grade: 'A', multiplier: 1.2, basePrice: 8000 };

    it('should add grade rule to pricing config', async () => {
      mockPrisma.pricing.findUnique.mockResolvedValue({
        ...mockPricing(false),
        gradeRules: [],
      });
      mockPrisma.gradeRule.create.mockResolvedValue(mockGradeRule(OilGrade.A, 8000, 1.2));

      const result = await service.addGradeRule('pricing-1', dto);

      expect(mockPrisma.gradeRule.create).toHaveBeenCalledWith({
        data: {
          pricingId: 'pricing-1',
          grade: OilGrade.A,
          basePrice: 8000,
          qualityFactor: 1.2,
        },
      });
      expect(result.grade).toBe(OilGrade.A);
    });

    it('should throw NotFoundException if pricing not found', async () => {
      mockPrisma.pricing.findUnique.mockResolvedValue(null);

      await expect(service.addGradeRule('pricing-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for duplicate grade', async () => {
      mockPrisma.pricing.findUnique.mockResolvedValue({
        ...mockPricing(false),
        gradeRules: [mockGradeRule(OilGrade.A, 8000, 1.2)],
      });

      await expect(service.addGradeRule('pricing-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid grade value', async () => {
      mockPrisma.pricing.findUnique.mockResolvedValue({
        ...mockPricing(false),
        gradeRules: [],
      });

      await expect(
        service.addGradeRule('pricing-1', { grade: 'X', multiplier: 1.2 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should add multiple different grades', async () => {
      mockPrisma.pricing.findUnique.mockResolvedValue({
        ...mockPricing(false),
        gradeRules: [mockGradeRule(OilGrade.A, 8000, 1.2)],
      });
      mockPrisma.gradeRule.create.mockResolvedValue(mockGradeRule(OilGrade.B, 8000, 1.0));

      await service.addGradeRule('pricing-1', { grade: 'B', multiplier: 1.0, basePrice: 8000 });

      expect(mockPrisma.gradeRule.create).toHaveBeenCalledWith({
        data: {
          pricingId: 'pricing-1',
          grade: OilGrade.B,
          basePrice: 8000,
          qualityFactor: 1.0,
        },
      });
    });
  });

  describe('addVolumeRule', () => {
    const dto = { minVolume: 0, maxVolume: 100, percentage: 0 };

    it('should add volume rule to pricing config', async () => {
      mockPrisma.pricing.findUnique.mockResolvedValue({
        ...mockPricing(false),
        volumeRules: [],
      });
      mockPrisma.volumeRule.create.mockResolvedValue(mockVolumeRule(0, 100, 0));

      const result = await service.addVolumeRule('pricing-1', dto);

      expect(mockPrisma.volumeRule.create).toHaveBeenCalledWith({
        data: {
          pricingId: 'pricing-1',
          minVolume: 0,
          maxVolume: 100,
          bonusFactor: 0,
        },
      });
      expect(result).toEqual(mockVolumeRule(0, 100, 0));
    });

    it('should throw NotFoundException if pricing not found', async () => {
      mockPrisma.pricing.findUnique.mockResolvedValue(null);

      await expect(service.addVolumeRule('pricing-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if minVolume > maxVolume', async () => {
      mockPrisma.pricing.findUnique.mockResolvedValue({
        ...mockPricing(false),
        volumeRules: [],
      });

      await expect(
        service.addVolumeRule('pricing-1', { minVolume: 200, maxVolume: 100, percentage: 0 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for overlapping ranges', async () => {
      mockPrisma.pricing.findUnique.mockResolvedValue({
        ...mockPricing(false),
        volumeRules: [mockVolumeRule(0, 100, 0)],
      });

      await expect(
        service.addVolumeRule('pricing-1', { minVolume: 50, maxVolume: 150, percentage: 0.05 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow non-overlapping ranges', async () => {
      mockPrisma.pricing.findUnique.mockResolvedValue({
        ...mockPricing(false),
        volumeRules: [mockVolumeRule(0, 100, 0)],
      });
      mockPrisma.volumeRule.create.mockResolvedValue(mockVolumeRule(101, 500, 0.05));

      await service.addVolumeRule('pricing-1', { minVolume: 101, maxVolume: 500, percentage: 0.05 });

      expect(mockPrisma.volumeRule.create).toHaveBeenCalledWith({
        data: {
          pricingId: 'pricing-1',
          minVolume: 101,
          maxVolume: 500,
          bonusFactor: 0.05,
        },
      });
    });

    it('should allow null maxVolume for open-ended range', async () => {
      mockPrisma.pricing.findUnique.mockResolvedValue({
        ...mockPricing(false),
        volumeRules: [mockVolumeRule(0, 100, 0), mockVolumeRule(101, 500, 0.05)],
      });
      mockPrisma.volumeRule.create.mockResolvedValue(mockVolumeRule(501, null, 0.1));

      await service.addVolumeRule('pricing-1', { minVolume: 501, maxVolume: null, percentage: 0.1 });

      expect(mockPrisma.volumeRule.create).toHaveBeenCalledWith({
        data: {
          pricingId: 'pricing-1',
          minVolume: 501,
          maxVolume: null,
          bonusFactor: 0.1,
        },
      });
    });

    it('should allow negative percentage (discount)', async () => {
      mockPrisma.pricing.findUnique.mockResolvedValue({
        ...mockPricing(false),
        volumeRules: [],
      });
      mockPrisma.volumeRule.create.mockResolvedValue(mockVolumeRule(0, 100, -0.05));

      await service.addVolumeRule('pricing-1', { minVolume: 0, maxVolume: 100, percentage: -0.05 });

      expect(mockPrisma.volumeRule.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ bonusFactor: -0.05 }),
        }),
      );
    });
  });

  describe('activate', () => {
    it('should deactivate all others and activate selected config', async () => {
      mockPrisma.pricing.findUnique.mockResolvedValue(mockPricing(false));
      mockPrisma.pricing.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.pricing.update.mockResolvedValue({ ...mockPricing(false), active: true });
      mockPrisma.$transaction.mockImplementation(async (ops) => {
        const results = await Promise.all(ops);
        return results;
      });

      const result = await service.activate('pricing-1');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result.active).toBe(true);
    });

    it('should throw NotFoundException if pricing not found', async () => {
      mockPrisma.pricing.findUnique.mockResolvedValue(null);

      await expect(service.activate('pricing-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('calculate', () => {
    const activePricingWithRules = {
      ...mockPricing(true),
      gradeRules: [
        mockGradeRule(OilGrade.A, 8000, 1.2),
        mockGradeRule(OilGrade.B, 8000, 1.0),
        mockGradeRule(OilGrade.C, 8000, 0.8),
      ],
      volumeRules: [
        mockVolumeRule(0, 100, 0),
        mockVolumeRule(101, 500, 0.05),
        mockVolumeRule(501, null, 0.1),
      ],
    };

    const labResultGradeA = {
      id: 'lab-1',
      batchId: 'batch-1',
      grade: OilGrade.A,
      acidityLevel: 1.5,
      waterContent: 0.2,
      impurityLevel: 0.1,
    };

    it('should calculate final price for Grade A, 80L (volume range 0-100)', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.approved, 80, false));
      mockPrisma.labResult.findUnique.mockResolvedValue(labResultGradeA);
      mockPrisma.pricing.findFirst.mockResolvedValue(activePricingWithRules);
      mockPrisma.batchPricing.create.mockResolvedValue({
        id: 'bp-1',
        batchId: 'batch-1',
        pricingId: 'pricing-1',
        finalPricePerLiter: 9600,
        totalValue: 768000,
      });

      // gradeAdjusted = 8000 * 1.2 = 9600
      // volumeAdjusted = 9600 + (9600 * 0) = 9600
      // totalValue = 80 * 9600 = 768000
      const result = await service.calculate('batch-1');

      expect(mockPrisma.batchPricing.create).toHaveBeenCalledWith({
        data: {
          batchId: 'batch-1',
          pricingId: 'pricing-1',
          finalPricePerLiter: 9600,
          totalValue: 768000,
        },
      });
      expect(result.finalPricePerLiter).toBe(9600);
      expect(result.totalValue).toBe(768000);
    });

    it('should calculate final price for Grade B, 200L (volume range 101-500, +5%)', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.approved, 200, false));
      mockPrisma.labResult.findUnique.mockResolvedValue({ ...labResultGradeA, grade: OilGrade.B });
      mockPrisma.pricing.findFirst.mockResolvedValue(activePricingWithRules);
      mockPrisma.batchPricing.create.mockResolvedValue({
        id: 'bp-2',
        batchId: 'batch-1',
        pricingId: 'pricing-1',
        finalPricePerLiter: 8400,
        totalValue: 1680000,
      });

      // gradeAdjusted = 8000 * 1.0 = 8000
      // volumeAdjusted = 8000 + (8000 * 0.05) = 8400
      // totalValue = 200 * 8400 = 1680000
      const result = await service.calculate('batch-1');

      expect(result.finalPricePerLiter).toBe(8400);
      expect(result.totalValue).toBe(1680000);
    });

    it('should calculate final price for Grade C, 600L (volume range 501+, +10%)', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.approved, 600, false));
      mockPrisma.labResult.findUnique.mockResolvedValue({ ...labResultGradeA, grade: OilGrade.C });
      mockPrisma.pricing.findFirst.mockResolvedValue(activePricingWithRules);
      mockPrisma.batchPricing.create.mockResolvedValue({
        id: 'bp-3',
        batchId: 'batch-1',
        pricingId: 'pricing-1',
        finalPricePerLiter: 7040,
        totalValue: 4224000,
      });

      // gradeAdjusted = 8000 * 0.8 = 6400
      // volumeAdjusted = 6400 + (6400 * 0.1) = 7040
      // totalValue = 600 * 7040 = 4224000
      const result = await service.calculate('batch-1');

      expect(result.finalPricePerLiter).toBe(7040);
      expect(result.totalValue).toBe(4224000);
    });

    it('should throw NotFoundException if batch not found', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(null);

      await expect(service.calculate('batch-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if batch not approved', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.sent, 80, false));

      await expect(service.calculate('batch-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if pricing already calculated', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.approved, 80, true));

      await expect(service.calculate('batch-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no lab result', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.approved, 80, false));
      mockPrisma.labResult.findUnique.mockResolvedValue(null);

      await expect(service.calculate('batch-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no active pricing', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.approved, 80, false));
      mockPrisma.labResult.findUnique.mockResolvedValue(labResultGradeA);
      mockPrisma.pricing.findFirst.mockResolvedValue(null);

      await expect(service.calculate('batch-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no grade rule for lab grade', async () => {
      const pricingNoGradeA = {
        ...mockPricing(true),
        gradeRules: [mockGradeRule(OilGrade.B, 8000, 1.0)],
        volumeRules: [mockVolumeRule(0, 100, 0)],
      };
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.approved, 80, false));
      mockPrisma.labResult.findUnique.mockResolvedValue(labResultGradeA);
      mockPrisma.pricing.findFirst.mockResolvedValue(pricingNoGradeA);

      await expect(service.calculate('batch-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no volume rule matches', async () => {
      const pricingNoVolumeMatch = {
        ...mockPricing(true),
        gradeRules: [mockGradeRule(OilGrade.A, 8000, 1.2)],
        volumeRules: [mockVolumeRule(500, null, 0.1)],
      };
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.approved, 80, false));
      mockPrisma.labResult.findUnique.mockResolvedValue(labResultGradeA);
      mockPrisma.pricing.findFirst.mockResolvedValue(pricingNoVolumeMatch);

      await expect(service.calculate('batch-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if cleanOil is 0', async () => {
      mockPrisma.batch.findUnique.mockResolvedValue(mockBatch(BatchStatus.approved, 0, false));
      mockPrisma.labResult.findUnique.mockResolvedValue(labResultGradeA);
      mockPrisma.pricing.findFirst.mockResolvedValue(activePricingWithRules);

      await expect(service.calculate('batch-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all pricing configs with relations', async () => {
      const pricings = [mockPricing(true), mockPricing(false)];
      mockPrisma.pricing.findMany.mockResolvedValue(pricings);

      const result = await service.findAll();

      expect(mockPrisma.pricing.findMany).toHaveBeenCalledWith({
        include: expect.objectContaining({
          gradeRules: true,
          volumeRules: true,
        }),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(pricings);
    });
  });

  describe('findOne', () => {
    it('should return pricing config with relations', async () => {
      const pricing = {
        ...mockPricing(true),
        gradeRules: [mockGradeRule(OilGrade.A, 8000, 1.2)],
        volumeRules: [mockVolumeRule(0, 100, 0)],
        batchPricings: [],
      };
      mockPrisma.pricing.findUnique.mockResolvedValue(pricing);

      const result = await service.findOne('pricing-1');

      expect(result).toEqual(pricing);
    });

    it('should throw NotFoundException if pricing not found', async () => {
      mockPrisma.pricing.findUnique.mockResolvedValue(null);

      await expect(service.findOne('pricing-1')).rejects.toThrow(NotFoundException);
    });
  });
});
