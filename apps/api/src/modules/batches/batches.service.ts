import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, BatchStatus, SubmissionStatus } from '@prisma/client';
import type {
  ICreateBatchDto,
  IAddBatchItemsDto,
  IProcessBatchDto,
} from '@repo/dto';

@Injectable()
export class BatchesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: ICreateBatchDto) {
    const collectorProfile = await this.prisma.collectorProfile.findUnique({
      where: { userId },
    });

    if (!collectorProfile) {
      throw new NotFoundException(
        'Collector profile not found. Please create your collector profile first.',
      );
    }

    const batch = await this.prisma.batch.create({
      data: {
        collectorId: collectorProfile.id,
        validatedBy: userId,
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
          include: { user: { select: { id: true, fullName: true, email: true } } },
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
    });

    if (!batch) {
      throw new NotFoundException('Batch not found.');
    }

    if (batch.collectorId !== collectorProfile.id) {
      throw new ForbiddenException('This batch does not belong to you.');
    }

    if (dto.rawOil <= 0) {
      throw new BadRequestException('Raw oil must be greater than 0.');
    }

    if (dto.residue > dto.rawOil) {
      throw new BadRequestException('Residue cannot be greater than raw oil.');
    }

    const clean = dto.rawOil - dto.residue;
    const yieldRatio = clean / dto.rawOil;
    const sedimentRatio = dto.residue / dto.rawOil;

    return this.prisma.batch.update({
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

    if (batch.status === BatchStatus.sent) {
      throw new BadRequestException('Batch has already been sent.');
    }

    return this.prisma.batch.update({
      where: { id: batchId },
      data: {
        status: BatchStatus.sent,
      },
    });
  }

  async findOne(batchId: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        collector: {
          include: { user: { select: { id: true, fullName: true, email: true } } },
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

    return batch;
  }
}
