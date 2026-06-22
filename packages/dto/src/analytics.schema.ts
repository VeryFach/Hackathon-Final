
import { z } from "zod";

export const StakeholderDashboardSchema = z.object({
    totalSupply: z.object({
        raw: z.number(),
        clean: z.number(),
    }),
    gradeDistribution: z.record(z.string(), z.number()),
    yieldPerformance: z.object({
        avgYield: z.number(),
        avgSediment: z.number(),
    }),
    financialOverview: z.object({
        totalMarketValue: z.number(),
        averagePricePerLiter: z.number(),
    }),
    approvedBatches: z.number(),
    rejectedBatches: z.number(),
});

export type StakeholderDashboardDto =
    z.infer<typeof StakeholderDashboardSchema>;