import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  BatchStatus,
  OilGrade,
  PayoutStatus,
  SubmissionStatus,
} from '@prisma/client';
import type {
  ICreatePricingDto,
  ICreateGradeRuleDto,
  ICreateVolumeRuleDto,
} from '@repo/dto';

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: ICreatePricingDto) {
    return this.prisma.pricing.create({
      data: {
        createdBy: userId,
        active: false,
      },
    });
  }

  async addGradeRule(pricingId: string, dto: ICreateGradeRuleDto) {
    const pricing = await this.prisma.pricing.findUnique({
      where: { id: pricingId },
      include: { gradeRules: true },
    });

    if (!pricing) {
      throw new NotFoundException('Pricing configuration not found.');
    }

    // Validate grade is a valid OilGrade enum value
    if (!Object.values(OilGrade).includes(dto.grade as OilGrade)) {
      throw new BadRequestException(
        `Invalid grade "${dto.grade}". Must be one of: ${Object.values(OilGrade).join(', ')}`,
      );
    }

    const grade = dto.grade as OilGrade;

    // Check for duplicate grade within the same pricing config
    const existingRule = pricing.gradeRules.find((r) => r.grade === grade);
    if (existingRule) {
      throw new BadRequestException(
        `Grade rule for grade "${dto.grade}" already exists in this pricing configuration.`,
      );
    }

    return this.prisma.gradeRule.create({
      data: {
        pricingId,
        grade,
        basePrice: dto.basePrice ?? 0,
        qualityFactor: dto.multiplier,
      },
    });
  }

  async addVolumeRule(pricingId: string, dto: ICreateVolumeRuleDto) {
    const pricing = await this.prisma.pricing.findUnique({
      where: { id: pricingId },
      include: { volumeRules: true },
    });

    if (!pricing) {
      throw new NotFoundException('Pricing configuration not found.');
    }

    // Validate minVolume <= maxVolume when maxVolume is provided
    if (dto.maxVolume !== null && dto.maxVolume !== undefined) {
      if (dto.minVolume > dto.maxVolume) {
        throw new BadRequestException(
          `minVolume (${dto.minVolume}) cannot be greater than maxVolume (${dto.maxVolume}).`,
        );
      }
    }

    // Check for overlapping ranges
    for (const existing of pricing.volumeRules) {
      const existingMax = existing.maxVolume;

      if (dto.maxVolume !== null && dto.maxVolume !== undefined && existingMax !== null) {
        // Both ranges are bounded
        if (dto.minVolume <= existingMax && dto.maxVolume >= existing.minVolume) {
          throw new BadRequestException(
            `Volume range ${dto.minVolume}-${dto.maxVolume} overlaps with existing range ${existing.minVolume}-${existingMax}.`,
          );
        }
      } else if (existingMax === null) {
        // Existing rule is unbounded (open-ended)
        if (dto.minVolume >= existing.minVolume) {
          throw new BadRequestException(
            `Volume range overlaps with existing open-ended range starting at ${existing.minVolume}.`,
          );
        }
      } else if (dto.maxVolume === null || dto.maxVolume === undefined) {
        // New rule is unbounded
        if (dto.minVolume <= existingMax) {
          throw new BadRequestException(
            `Open-ended range starting at ${dto.minVolume} overlaps with existing range ${existing.minVolume}-${existingMax}.`,
          );
        }
      }
    }

    return this.prisma.volumeRule.create({
      data: {
        pricingId,
        minVolume: dto.minVolume,
        maxVolume: dto.maxVolume ?? null,
        bonusFactor: dto.percentage,
      },
    });
  }

  async activate(pricingId: string) {
    const pricing = await this.prisma.pricing.findUnique({
      where: { id: pricingId },
    });

    if (!pricing) {
      throw new NotFoundException('Pricing configuration not found.');
    }

    // Deactivate all active configs and activate the selected one in a transaction
    return this.prisma.$transaction([
      this.prisma.pricing.updateMany({
        where: { active: true },
        data: { active: false },
      }),
      this.prisma.pricing.update({
        where: { id: pricingId },
        data: { active: true },
      }),
    ]).then(([, activated]) => activated);
  }

  async calculate(batchId: string) {
    // Step 1: Get batch
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: { batchPricing: true },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found.');
    }

    // Step 2: Validate batch is processed (approved)
    if (batch.status !== BatchStatus.approved) {
      throw new BadRequestException(
        `Cannot calculate pricing for batch with status "${batch.status}". Only approved batches can be priced.`,
      );
    }

    // Step 3: Prevent duplicate calculation
    if (batch.batchPricing) {
      throw new BadRequestException(
        'Pricing has already been calculated for this batch.',
      );
    }

    // Step 4: Get lab result
    const labResult = await this.prisma.labResult.findUnique({
      where: { batchId },
    });

    if (!labResult) {
      throw new BadRequestException(
        'Cannot calculate pricing without lab inspection. Please create a lab result first.',
      );
    }

    const grade = labResult.grade;

    // Step 5: Get active pricing config
    const activePricing = await this.prisma.pricing.findFirst({
      where: { active: true },
      include: {
        gradeRules: true,
        volumeRules: true,
      },
    });

    if (!activePricing) {
      throw new BadRequestException(
        'No active pricing configuration found. Please activate a pricing config first.',
      );
    }

    // Step 6: Find grade rule for this grade
    const gradeRule = activePricing.gradeRules.find((r) => r.grade === grade);

    if (!gradeRule) {
      throw new BadRequestException(
        `No grade rule found for grade "${grade}" in the active pricing configuration.`,
      );
    }

    // Step 7: Get clean oil volume
    const totalRawOilLiter = Number(batch.totalRawOilLiter);
    const cleanOil = Number(batch.totalCleanOilLiter);

    if (totalRawOilLiter <= 0) {
      throw new BadRequestException(
        'Batch has no raw oil volume. Cannot calculate depositor payouts.',
      );
    }

    if (cleanOil <= 0) {
      throw new BadRequestException(
        'Batch has no clean oil volume. Cannot calculate pricing.',
      );
    }

    // Step 8: Find matching volume rule
    const volumeRule = activePricing.volumeRules.find((rule) => {
      if (rule.maxVolume === null) {
        return cleanOil >= rule.minVolume;
      }
      return cleanOil >= rule.minVolume && cleanOil <= rule.maxVolume;
    });

    if (!volumeRule) {
      throw new BadRequestException(
        `No volume rule matches clean oil volume ${cleanOil}L in the active pricing configuration.`,
      );
    }

    // Step 9: Calculate final price
    // gradeAdjusted = basePrice * qualityFactor
    const gradeAdjusted = gradeRule.basePrice * gradeRule.qualityFactor;

    // volumeAdjusted = gradeAdjusted + (gradeAdjusted * bonusFactor)
    const volumeAdjusted = gradeAdjusted + (gradeAdjusted * volumeRule.bonusFactor);

    // finalPricePerLiter = volumeAdjusted (price per liter)
    const finalPricePerLiter = volumeAdjusted;

    // totalValue = cleanOil * finalPricePerLiter
    const totalValue = cleanOil * finalPricePerLiter;

    // Step 10: Save BatchPricing and settle depositor payouts.
    return this.prisma.$transaction(async (tx) => {
      const batchPricing = await tx.batchPricing.create({
        data: {
          batchId,
          pricingId: activePricing.id,
          finalPricePerLiter,
          totalValue,
        },
      });

      const batchItems = await tx.batchItem.findMany({
        where: { batchId },
        include: {
          submission: {
            select: {
              id: true,
              actualLiter: true,
            },
          },
        },
      });

      const paidAt = new Date();
      const payouts = [];

      for (const item of batchItems) {
        const actualLiter = item.submission.actualLiter ?? 0;

        if (actualLiter <= 0) {
          throw new BadRequestException(
            `Submission "${item.submission.id}" must have actual liter greater than 0 before payout can be settled.`,
          );
        }

        const submissionRatio = actualLiter / totalRawOilLiter;
        const amount = totalValue * submissionRatio;

        const payout = await tx.payout.upsert({
          where: { submissionId: item.submission.id },
          create: {
            submissionId: item.submission.id,
            amount,
            status: PayoutStatus.paid,
            paidAt,
          },
          update: {
            amount,
            status: PayoutStatus.paid,
            paidAt,
          },
        });

        payouts.push(payout);
      }

      await tx.oilSubmission.updateMany({
        where: {
          id: {
            in: batchItems.map((item) => item.submission.id),
          },
        },
        data: { status: SubmissionStatus.completed },
      });

      return {
        ...batchPricing,
        payouts,
      };
    });
  }

  async findAll() {
    return this.prisma.pricing.findMany({
      include: {
        gradeRules: true,
        volumeRules: true,
        batchPricings: {
          include: {
            batch: {
              include: {
                labResult: true,
              },
            },
          },
        },
        creator: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(pricingId: string) {
    const pricing = await this.prisma.pricing.findUnique({
      where: { id: pricingId },
      include: {
        gradeRules: true,
        volumeRules: true,
        batchPricings: {
          include: {
            batch: {
              include: {
                labResult: true,
              },
            },
          },
        },
        creator: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!pricing) {
      throw new NotFoundException('Pricing configuration not found.');
    }

    return pricing;
  }
}
