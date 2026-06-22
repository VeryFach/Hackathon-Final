import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  Prisma,
  BatchStatus,
  SubmissionStatus,
  UserRole,
} from '@prisma/client';
import type {
  ICreateBatchDto,
  IAddBatchItemsDto,
  IProcessBatchDto,
} from '@repo/dto';
import { notifyAIService } from '../../lib/ai-webhook.js';

@Injectable()
export class BatchesService {
  constructor(private prisma: PrismaService) {}

  private async getOrCreateCollectorProfile(userId: string) {
    const collectorProfile = await this.prisma.collectorProfile.findUnique({
      where: { userId },
    });

    if (collectorProfile) {
      return collectorProfile;
    }

    return this.prisma.collectorProfile.create({
      data: {
        userId,
        latitude: '0',
        longitude: '0',
        warehouseAddress: 'Belum diatur',
        serviceRadiusKm: 0,
        capacityLiter: 0,
      },
    });
  }

  async create(userId: string, dto: ICreateBatchDto) {
    const collectorProfile = await this.getOrCreateCollectorProfile(userId);

    const batch = await this.prisma.batch.create({
      data: {
        collectorId: collectorProfile.id,
        totalRawOilLiter: 0,
        totalCleanOilLiter: 0,
        residueLiter: 0,
        sedimentRatio: new Prisma.Decimal(0),
        yieldRatio: new Prisma.Decimal(0),
        totalLiter: 0,
        status: BatchStatus.draft,
      },
    });

    return batch;
  }

  async findMine(userId: string) {
    const collectorProfile = await this.prisma.collectorProfile.findUnique({
      where: { userId },
    });

    if (!collectorProfile) {
      return [];
    }

    return this.prisma.batch.findMany({
      where: { collectorId: collectorProfile.id },
      include: {
        batchItems: { include: { submission: true } },
        labResult: true,
        batchPricing: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllForStakeholder() {
    return this.prisma.batch.findMany({
      include: {
        collector: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        validator: {
          select: { id: true, fullName: true, email: true },
        },
        labResult: true,
        batchPricing: true,
        batchItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addItems(batchId: string, userId: string, dto: IAddBatchItemsDto) {
    const collectorProfile = await this.prisma.collectorProfile.findUnique({
      where: { userId },
    });

    if (!collectorProfile) {
      throw new NotFoundException('Collector profile not found.');
    }

    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found.');
    }

    if (batch.collectorId !== collectorProfile.id) {
      throw new ForbiddenException('This batch does not belong to you.');
    }

    if (batch.status !== BatchStatus.draft) {
      throw new BadRequestException(
        `Cannot add items to batch with status "${batch.status}". Only draft batches can accept items.`,
      );
    }

    // Validate all submissions
    const submissions = await this.prisma.oilSubmission.findMany({
      where: { id: { in: dto.submissionIds } },
    });

    if (submissions.length !== dto.submissionIds.length) {
      throw new BadRequestException('One or more submission IDs are invalid.');
    }

    for (const sub of submissions) {
      if (sub.collectorId !== collectorProfile.id) {
        throw new ForbiddenException(
          `Submission "${sub.id}" does not belong to you.`,
        );
      }

      if (sub.status !== SubmissionStatus.picked_up) {
        throw new BadRequestException(
          `Submission "${sub.id}" has status "${sub.status}". Only picked_up submissions can be added to a batch.`,
        );
      }

      if (sub.actualLiter === null || sub.actualLiter === undefined) {
        throw new BadRequestException(
          `Submission "${sub.id}" must have actual liter recorded before it can be added to a batch.`,
        );
      }
    }

    const existingBatchItems = await this.prisma.batchItem.findMany({
      where: { submissionId: { in: dto.submissionIds } },
      select: { submissionId: true },
    });

    if (existingBatchItems.length > 0) {
      const ids = existingBatchItems
        .map((item) => item.submissionId)
        .join(', ');
      throw new BadRequestException(
        `One or more submissions are already assigned to a batch: ${ids}.`,
      );
    }

    // Create BatchItems and update submission statuses in a transaction
    const batchItemOps = dto.submissionIds.map((submissionId) =>
      this.prisma.batchItem.create({
        data: { batchId, submissionId },
      }),
    );

    const submissionUpdateOps = dto.submissionIds.map((id) =>
      this.prisma.oilSubmission.update({
        where: { id },
        data: { status: SubmissionStatus.in_batch },
      }),
    );

    await this.prisma.$transaction([...batchItemOps, ...submissionUpdateOps]);

    // Return the updated batch
    return this.prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        batchItems: { include: { submission: true } },
        collector: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });
  }

  async process(batchId: string, userId: string, dto: IProcessBatchDto) {
    const collectorProfile = await this.prisma.collectorProfile.findUnique({
      where: { userId },
    });

    if (!collectorProfile) {
      throw new NotFoundException('Collector profile not found.');
    }

    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        batchItems: {
          include: {
            submission: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found.');
    }

    if (batch.collectorId !== collectorProfile.id) {
      throw new ForbiddenException('This batch does not belong to you.');
    }

    if (batch.status !== BatchStatus.draft) {
      throw new BadRequestException(
        `Cannot process batch with status "${batch.status}". Only draft batches can be processed.`,
      );
    }

    if (batch.batchItems.length === 0) {
      throw new BadRequestException(
        'Batch must contain at least one submission before processing.',
      );
    }

    const actualLiterTotal = batch.batchItems.reduce(
      (total, item) => total + (item.submission.actualLiter ?? 0),
      0,
    );

    if (Math.abs(actualLiterTotal - dto.rawOil) > 0.001) {
      throw new BadRequestException(
        `Raw oil (${dto.rawOil}L) must match total actual liter from submissions (${actualLiterTotal}L).`,
      );
    }

    if (dto.rawOil <= 0) {
      throw new BadRequestException('Raw oil must be greater than 0.');
    }

    if (dto.residue > dto.rawOil) {
      throw new BadRequestException('Residue cannot be greater than raw oil.');
    }

    const processLoss = dto.processLoss ?? 0;
    const clean = dto.rawOil - dto.residue - processLoss;

    if (clean < 0) {
      throw new BadRequestException(
        'Clean oil cannot be negative. Raw oil must be greater than residue plus process loss.',
      );
    }

    const yieldRatio = dto.rawOil > 0 ? clean / dto.rawOil : 0;

    const sedimentRatio = dto.rawOil > 0 ? dto.residue / dto.rawOil : 0;

    const updatedBatch = this.prisma.batch.update({
      where: { id: batchId },
      data: {
        totalRawOilLiter: dto.rawOil,
        totalCleanOilLiter: clean,
        residueLiter: dto.residue,
        yieldRatio: new Prisma.Decimal(yieldRatio.toFixed(4)),
        sedimentRatio: new Prisma.Decimal(sedimentRatio.toFixed(4)),
        totalLiter: clean,
      },
    });
    return updatedBatch;
  }

  async send(batchId: string, userId: string) {
    const collectorProfile = await this.prisma.collectorProfile.findUnique({
      where: { userId },
    });

    if (!collectorProfile) {
      throw new NotFoundException('Collector profile not found.');
    }

    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found.');
    }

    if (batch.collectorId !== collectorProfile.id) {
      throw new ForbiddenException('This batch does not belong to you.');
    }

    if (batch.totalRawOilLiter <= 0) {
      throw new BadRequestException(
        'Batch must be processed before sending. Raw oil data is missing.',
      );
    }

    if (batch.status !== BatchStatus.draft) {
      throw new BadRequestException(
        `Cannot send batch with status "${batch.status}". Only draft batches can be sent.`,
      );
    }

    const updatedBatch = this.prisma.batch.update({
      where: { id: batchId },
      data: {
        status: BatchStatus.sent,
      },
    });
    return updatedBatch;
  }

  async findOne(batchId: string, userId?: string, role?: UserRole) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        collector: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        validator: {
          select: { id: true, fullName: true, email: true },
        },
        batchItems: {
          include: {
            submission: {
              include: {
                depositor: {
                  include: {
                    user: { select: { id: true, fullName: true, email: true } },
                  },
                },
              },
            },
          },
        },
        labResult: true,
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found.');
    }

    if (role === UserRole.pengepul) {
      if (!userId) {
        throw new ForbiddenException('This batch does not belong to you.');
      }

      const collectorProfile = await this.prisma.collectorProfile.findUnique({
        where: { userId },
      });

      if (!collectorProfile || batch.collectorId !== collectorProfile.id) {
        throw new ForbiddenException('This batch does not belong to you.');
      }
    }

    return batch;
  }
}
