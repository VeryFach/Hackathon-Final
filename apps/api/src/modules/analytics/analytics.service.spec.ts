import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AnalyticsService', () => {
    let service: AnalyticsService;

    const prismaMock = {
        depositorProfile: {
            findUnique: jest.fn(),
        },
        collectorProfile: {
            findUnique: jest.fn(),
        },
        oilSubmission: {
            count: jest.fn(),
            aggregate: jest.fn(),
            findMany: jest.fn(),
        },
        payout: {
            aggregate: jest.fn(),
        },
        batch: {
            aggregate: jest.fn(),
            count: jest.fn(),
        },
        batchPricing: {
            aggregate: jest.fn(),
            count: jest.fn(),
        },
        labResult: {
            groupBy: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnalyticsService,
                {
                    provide: PrismaService,
                    useValue: prismaMock,
                },
            ],
        }).compile();

        service = module.get<AnalyticsService>(AnalyticsService);
        jest.clearAllMocks();
    });

    describe('getDepositorDashboard', () => {
        it('should return depositor analytics', async () => {
            prismaMock.depositorProfile.findUnique.mockResolvedValue({
                id: 'depositor-1',
            });

            prismaMock.oilSubmission.count
                .mockResolvedValueOnce(10)
                .mockResolvedValueOnce(7);

            prismaMock.payout.aggregate.mockResolvedValue({
                _sum: { amount: 500000 },
                _avg: { amount: 50000 },
            });

            prismaMock.oilSubmission.findMany.mockResolvedValue([
                { id: 'sub-1' },
            ]);

            const result = await service.getDepositorDashboard('user-1');

            expect(result).toEqual({
                totalSubmissions: 10,
                completedSubmissions: 7,
                earnings: 500000,
                averagePayout: 50000,
                latestSubmissions: [{ id: 'sub-1' }],
            });
        });

        it('should throw if depositor not found', async () => {
            prismaMock.depositorProfile.findUnique.mockResolvedValue(null);

            await expect(
                service.getDepositorDashboard('user-1'),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('getCollectorDashboard', () => {
        it('should return collector analytics', async () => {
            prismaMock.collectorProfile.findUnique.mockResolvedValue({
                id: 'collector-1',
            });

            prismaMock.batch.aggregate.mockResolvedValue({
                _avg: { yieldRatio: 0.8 },
            });

            prismaMock.batch.count
                .mockResolvedValueOnce(2)
                .mockResolvedValueOnce(1);

            prismaMock.oilSubmission.aggregate.mockResolvedValue({
                _sum: { actualLiter: 300 },
            });

            prismaMock.batchPricing.aggregate.mockResolvedValue({
                _sum: { totalValue: 1000000 },
                _avg: { finalPricePerLiter: 7000 },
            });

            prismaMock.batchPricing.count.mockResolvedValue(3);

            const result = await service.getCollectorDashboard('user-2');

            expect(result.financial.totalRevenue).toBe(1000000);
            expect(result.financial.pricedBatches).toBe(3);
        });

        it('should return empty collector analytics if collector profile is not found', async () => {
            prismaMock.collectorProfile.findUnique.mockResolvedValue(null);

            await expect(service.getCollectorDashboard('user-2')).resolves.toEqual({
                totalCollected: 0,
                avgYieldRatio: 0,
                activeBatches: 0,
                sentBatches: 0,
                financial: {
                    totalRevenue: 0,
                    averagePricePerLiter: 0,
                    pricedBatches: 0,
                },
            });
        });
    });

    describe('getStakeholderDashboard', () => {
        it('should return stakeholder analytics', async () => {
            prismaMock.batch.aggregate
                .mockResolvedValueOnce({
                    _sum: {
                        totalRawOilLiter: 1000,
                        totalCleanOilLiter: 800,
                    },
                })
                .mockResolvedValueOnce({
                    _avg: {
                        yieldRatio: 0.8,
                        sedimentRatio: 0.2,
                    },
                });

            prismaMock.labResult.groupBy.mockResolvedValue([
                { grade: 'A', _count: { grade: 4 } },
                { grade: 'B', _count: { grade: 2 } },
            ]);

            prismaMock.batch.count
                .mockResolvedValueOnce(5)
                .mockResolvedValueOnce(1);

            prismaMock.batchPricing.aggregate.mockResolvedValue({
                _sum: { totalValue: 2000000 },
                _avg: { finalPricePerLiter: 7500 },
            });

            const result = await service.getStakeholderDashboard();

            expect(result.totalSupply.raw).toBe(1000);
            expect(result.gradeDistribution.A).toBe(4);
            expect(result.approvedBatches).toBe(5);
        });
    });
});
