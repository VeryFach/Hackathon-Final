import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BatchStatus, OilGrade, UserRole } from '@prisma/client';
import type { ICreateLabResultDto, IRejectLabDto } from '@repo/dto';
import { notifyAIService } from '../../lib/ai-webhook.js';

@Injectable()
export class LabService {
  constructor(private prisma: PrismaService) {}

  private async createDefaultLabResult(batchId: string) {
    return this.prisma.labResult.create({
      data: {
        batchId,
        acidityLevel: 1.8,
        waterContent: 0.2,
        impurityLevel: 0.1,
        grade: OilGrade.A,
        notes: 'Auto-generated from stakeholder approval flow.',
      },
    });
  }

  /**
   * Calculate oil grade based on FFA, water, and impurity levels.
   * Grade A: FFA <= 2, Water <= 0.3, Impurity <= 0.2
   * Grade B: FFA <= 4, Water <= 0.5, Impurity <= 0.4
   * Grade C: FFA <= 6, Water <= 1,   Impurity <= 0.8
   * Returns null if values exceed all grade thresholds.
   */
  calculateGrade(
    ffa: number,
    water: number,
    impurity: number,
  ): OilGrade | null {
    const MAX_FFA = 6;
    const MAX_WATER = 1;
    const MAX_IMPURITY = 0.8;

    if (ffa > MAX_FFA || water > MAX_WATER || impurity > MAX_IMPURITY) {
      return null;
    }

    const normalizedFfa = ffa / MAX_FFA;
    const normalizedWater = water / MAX_WATER;
    const normalizedImpurity = impurity / MAX_IMPURITY;

    const score =
      normalizedFfa * 0.5 + normalizedWater * 0.3 + normalizedImpurity * 0.2;

    if (score <= 0.3) {
      return OilGrade.A;
    }

    if (score <= 0.6) {
      return OilGrade.B;
    }

    return OilGrade.C;
  }

  async create(batchId: string, dto: ICreateLabResultDto) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: { labResult: true },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found.');
    }

    if (batch.status !== BatchStatus.sent) {
      throw new BadRequestException(
        `Cannot inspect batch with status "${batch.status}". Only sent batches can be inspected.`,
      );
    }

    if (batch.labResult) {
      throw new BadRequestException(
        'Lab result already exists for this batch. Each batch can only have one lab inspection.',
      );
    }

    const grade = this.calculateGrade(dto.ffa, dto.water, dto.impurity);

    if (!grade) {
      throw new BadRequestException(
        'Quality values exceed all grade thresholds. FFA must be <= 6, water <= 1, impurity <= 0.8. Cannot assign a valid grade.',
      );
    }

    return this.prisma.labResult.create({
      data: {
        batchId,
        acidityLevel: dto.ffa,
        waterContent: dto.water,
        impurityLevel: dto.impurity,
        grade,
        notes: dto.notes,
      },
    });
  }

  async findByBatch(batchId: string, userId?: string, role?: UserRole) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found.');
    }

    if (role === UserRole.pengepul) {
      if (!userId) {
        throw new NotFoundException('No lab result found for this batch.');
      }

      const collectorProfile = await this.prisma.collectorProfile.findUnique({
        where: { userId },
      });

      if (!collectorProfile || batch.collectorId !== collectorProfile.id) {
        throw new NotFoundException('No lab result found for this batch.');
      }
    }

    const labResult = await this.prisma.labResult.findUnique({
      where: { batchId },
      include: {
        batch: {
          include: {
            collector: {
              include: {
                user: { select: { id: true, fullName: true, email: true } },
              },
            },
            validator: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
      },
    });

    if (!labResult) {
      throw new NotFoundException('No lab result found for this batch.');
    }

    return labResult;
  }

  async approve(batchId: string, validatorUserId?: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: { labResult: true },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found.');
    }

    if (batch.status !== BatchStatus.sent) {
      throw new BadRequestException(
        `Cannot approve batch with status "${batch.status}". Only sent batches can be approved.`,
      );
    }

    if (!batch.labResult) {
      await this.createDefaultLabResult(batchId);
    }

    const updatedBatch = await this.prisma.batch.update({
      where: { id: batchId },
      data: {
        status: BatchStatus.approved,
        ...(validatorUserId && { validatedBy: validatorUserId }),
      },
    });

    await notifyAIService('batch.approved', batch.id);

    return updatedBatch;
  }

  async reject(
    batchId: string,
    validatorUserIdOrDto?: string | IRejectLabDto,
    maybeDto?: IRejectLabDto,
  ) {
    const validatorUserId =
      typeof validatorUserIdOrDto === 'string'
        ? validatorUserIdOrDto
        : undefined;
    const dto =
      typeof validatorUserIdOrDto === 'string'
        ? maybeDto
        : validatorUserIdOrDto;
    void dto;

    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: { labResult: true },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found.');
    }

    if (batch.status !== BatchStatus.sent) {
      throw new BadRequestException(
        `Cannot reject batch with status "${batch.status}". Only sent batches can be rejected.`,
      );
    }

    if (!batch.labResult) {
      await this.prisma.labResult.create({
        data: {
          batchId,
          acidityLevel: 6,
          waterContent: 1,
          impurityLevel: 0.8,
          grade: OilGrade.C,
          notes: dto?.reason ?? 'Rejected by stakeholder.',
        },
      });
    }

    const updatedBatch = this.prisma.batch.update({
      where: { id: batchId },
      data: {
        status: BatchStatus.rejected,
        ...(validatorUserId && { validatedBy: validatorUserId }),
      },
    });
    
    return updatedBatch;
  }
}
