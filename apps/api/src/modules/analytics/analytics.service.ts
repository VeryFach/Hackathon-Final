import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
    SubmissionStatus,
    PayoutStatus,
    BatchStatus,
} from '@prisma/client';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    async getStakeholderDashboard() {
        const [
            supply,
            grades,
            yieldStats,
            approvedBatches,
            rejectedBatches,
            revenueStats
        ] =
            await Promise.all([
                this.prisma.batch.aggregate({
                    _sum: {
                        totalRawOilLiter: true,
                        totalCleanOilLiter: true,
                    },
                }),

                this.prisma.labResult.groupBy({
                    by: ['grade'],
                    _count: {
                        grade: true,
                    },
                }),

                this.prisma.batch.aggregate({
                    _avg: {
                        yieldRatio: true,
                        sedimentRatio: true,
                    },
                }),

                this.prisma.batch.count({
                    where: {
                        status: BatchStatus.approved,
                    },
                }),

                this.prisma.batch.count({
                    where: {
                        status: BatchStatus.rejected,
                    },
                }),

                this.prisma.batchPricing.aggregate({
                    _sum: {
                        totalValue: true,
                    },
                    _avg: {
                        finalPricePerLiter: true,
                    },
                }),
            ]);

        const gradeDistribution = grades.reduce(
            (acc, item) => {
                acc[item.grade] = item._count.grade;
                return acc;
            },
            {} as Record<string, number>,
        );

        return {
            totalSupply: {
                raw: supply._sum.totalRawOilLiter ?? 0,
                clean: supply._sum.totalCleanOilLiter ?? 0,
            },
            gradeDistribution,
            yieldPerformance: {
                avgYield: Number(yieldStats._avg.yieldRatio ?? 0),
                avgSediment: Number(yieldStats._avg.sedimentRatio ?? 0),
            },
            financialOverview: {
                totalMarketValue: revenueStats._sum.totalValue ?? 0,
                averagePricePerLiter:
                    revenueStats._avg.finalPricePerLiter ?? 0,
            },
            approvedBatches,
            rejectedBatches,
        };
    }

    async getCollectorDashboard(userId: string) {
        const collectorProfile = await this.prisma.collectorProfile.findUnique({
            where: { userId },
        });

        if (!collectorProfile) {
            throw new NotFoundException('Collector profile not found.');
        }

        const [
            yieldStats,
            activeBatches,
            sentBatches,
            totalCollected,
            revenueStats,
            pricedBatches,
        ] = await Promise.all([
            this.prisma.batch.aggregate({
                where: {
                    collectorId: collectorProfile.id,
                },
                _avg: {
                    yieldRatio: true,
                },
            }),

            this.prisma.batch.count({
                where: {
                    collectorId: collectorProfile.id,
                    status: BatchStatus.draft,
                },
            }),

            this.prisma.batch.count({
                where: {
                    collectorId: collectorProfile.id,
                    status: BatchStatus.sent,
                },
            }),

            this.prisma.oilSubmission.aggregate({
                where: {
                    collectorId: collectorProfile.id,
                },
                _sum: {
                    actualLiter: true,
                },
            }),

            this.prisma.batchPricing.aggregate({
                where: {
                    batch: {
                        collectorId: collectorProfile.id,
                    },
                },
                _sum: {
                    totalValue: true,
                },
                _avg: {
                    finalPricePerLiter: true,
                },
            }),

            this.prisma.batchPricing.count({
                where: {
                    batch: {
                        collectorId: collectorProfile.id,
                    },
                },
            }),
        ]);

        return {
            totalCollected: totalCollected._sum.actualLiter ?? 0,

            avgYieldRatio: Number(yieldStats._avg.yieldRatio ?? 0),

            activeBatches,
            sentBatches,

            financial: {
                totalRevenue: revenueStats._sum.totalValue ?? 0,
                averagePricePerLiter:
                    revenueStats._avg.finalPricePerLiter ?? 0,
                pricedBatches,
            },
        };
    }

    async getDepositorDashboard(userId: string) {
        const depositorProfile = await this.prisma.depositorProfile.findUnique({
            where: { userId },
        });

        if (!depositorProfile) {
            throw new NotFoundException('Depositor profile not found.');
        }

        const [
            totalSubmissions,
            completedSubmissions,
            earnings,
            latestSubmissions,
        ] =
            await Promise.all([
                this.prisma.oilSubmission.count({
                    where: {
                        depositorId: depositorProfile.id,
                    },
                }),

                this.prisma.oilSubmission.count({
                    where: {
                        depositorId: depositorProfile.id,
                        status: SubmissionStatus.completed,
                    },
                }),

                this.prisma.payout.aggregate({
                    _sum: {
                        amount: true,
                    },
                    _avg: {
                        amount: true,
                    },
                    where: {
                        status: PayoutStatus.paid,
                        submission: {
                            depositorId: depositorProfile.id,
                        },
                    },
                }),

                this.prisma.oilSubmission.findMany({
                    where: {
                        depositorId: depositorProfile.id,
                    },
                    include: {
                        payout: true,
                        batchItems: {
                            include: {
                                batch: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 5,
                }),
            ]);

        return {
            totalSubmissions,
            completedSubmissions,
            earnings: earnings._sum.amount ?? 0,
            averagePayout: earnings._avg.amount ?? 0,
            latestSubmissions,
        };
    }
}