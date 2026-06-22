import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BatchStatus, OilGrade } from '@prisma/client';
import type { ICreateLabResultDto, IRejectLabDto } from '@repo/dto';

@Injectable()
export class LabService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate oil grade based on FFA, water, and impurity levels.
   * Grade A: FFA <= 2, Water <= 0.3, Impurity <= 0.2
   * Grade B: FFA <= 4, Water <= 0.5, Impurity <= 0.4
   * Grade C: FFA <= 6, Water <= 1,   Impurity <= 0.8
   * Returns null if values exceed all grade thresholds.
   */
  calculateGrade(ffa: number, water: number, impurity: number): OilGrade | null {
    if (ffa <= 2 && water <= 0.3 && impurity <= 0.2) {
      return OilGrade.A;
    }
    if (ffa <= 4 && water <= 0.5 && impurity <= 0.4) {
      return OilGrade.B;
    }
    if (ffa <= 6 && water <= 1 && impurity <= 0.8) {
      return OilGrade.C;
    }
    return null;
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

  async findByBatch(batchId: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found.');
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

  async approve(batchId: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: { labResult: true },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found.');
    }

    if (!batch.labResult) {
      throw new BadRequestException(
        'Cannot approve batch without lab inspection. Please create a lab result first.',
      );
    }

    if (batch.status === BatchStatus.approved) {
      throw new BadRequestException('Batch has already been approved.');
    }

    if (batch.status === BatchStatus.rejected) {
      throw new BadRequestException('Batch has already been rejected.');
    }

    return this.prisma.batch.update({
      where: { id: batchId },
      data: { status: BatchStatus.approved },
    });
  }

  async reject(batchId: string, dto: IRejectLabDto) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: { labResult: true },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found.');
    }

    if (!batch.labResult) {
      throw new BadRequestException(
        'Cannot reject batch without lab inspection. Please create a lab result first.',
      );
    }

    if (batch.status === BatchStatus.approved) {
      throw new BadRequestException('Batch has already been approved.');
    }

    if (batch.status === BatchStatus.rejected) {
      throw new BadRequestException('Batch has already been rejected.');
    }

    return this.prisma.batch.update({
      where: { id: batchId },
      data: { status: BatchStatus.rejected },
    });
  }
}
