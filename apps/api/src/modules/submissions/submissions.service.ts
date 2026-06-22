import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SubmissionStatus } from '@prisma/client';
import { ICreateSubmissionDto, IMarkInBatchDto } from '@repo/dto';

@Injectable()
export class SubmissionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: ICreateSubmissionDto) {
    const depositorProfile = await this.prisma.depositorProfile.findUnique({
      where: { userId },
    });

    if (!depositorProfile) {
      throw new NotFoundException(
        'Depositor profile not found. Please create your depositor profile first.',
      );
    }

    const submission = await this.prisma.oilSubmission.create({
      data: {
        estimatedLiter: dto.estimatedLiter,
        depositorId: depositorProfile.id,
        status: SubmissionStatus.pending,
      },
    });

    return submission;
  }

  async findMine(userId: string) {
    const depositorProfile = await this.prisma.depositorProfile.findUnique({
      where: { userId },
    });

    if (!depositorProfile) {
      throw new NotFoundException('Depositor profile not found.');
    }

    return this.prisma.oilSubmission.findMany({
      where: { depositorId: depositorProfile.id },
      include: {
        collector: {
          include: { user: { select: { id: true, fullName: true, email: true } } },
        },
        depositor: {
          include: { user: { select: { id: true, fullName: true, email: true } } },
        },
        batchItems: {
          include: { 
            batch: {
              include: {
                labResult: true,
              },
            },
          },
        },
        payout: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(submissionId: string, userId: string) {
    const depositorProfile = await this.prisma.depositorProfile.findUnique({
      where: { userId },
    });

    if (!depositorProfile) {
      throw new NotFoundException('Depositor profile not found.');
    }

    const submission = await this.prisma.oilSubmission.findUnique({
      where: { id: submissionId },
      include: {
        collector: {
          include: { user: { select: { id: true, fullName: true, email: true } } },
        },
        depositor: {
          include: { user: { select: { id: true, fullName: true, email: true } } },
        },
        batchItems: {
          include: { 
            batch: {
              include: {
                labResult: true,
              },
            },
          },
        },
        payout: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found.');
    }

    // Verify ownership
    if (submission.depositorId !== depositorProfile.id) {
      throw new ForbiddenException('You are not authorized to view this submission.');
    }

    return submission;
  }

  async accept(submissionId: string, userId: string) {
    const collectorProfile = await this.prisma.collectorProfile.findUnique({
      where: { userId },
    });

    if (!collectorProfile) {
      throw new NotFoundException(
        'Collector profile not found. Please create your collector profile first.',
      );
    }

    const submission = await this.prisma.oilSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found.');
    }

    if (submission.status !== SubmissionStatus.pending) {
      throw new BadRequestException(
        `Cannot accept submission with status "${submission.status}". Only pending submissions can be accepted.`,
      );
    }

    return this.prisma.oilSubmission.update({
      where: { id: submissionId },
      data: {
        collectorId: collectorProfile.id,
        status: SubmissionStatus.accepted,
      },
    });
  }

  async pickup(submissionId: string, userId: string) {
    const collectorProfile = await this.prisma.collectorProfile.findUnique({
      where: { userId },
    });

    if (!collectorProfile) {
      throw new NotFoundException('Collector profile not found.');
    }

    const submission = await this.prisma.oilSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found.');
    }

    if (submission.status !== SubmissionStatus.accepted) {
      throw new BadRequestException(
        `Cannot pickup submission with status "${submission.status}". Only accepted submissions can be picked up.`,
      );
    }

    if (submission.collectorId !== collectorProfile.id) {
      throw new ForbiddenException(
        'Only the assigned collector can pick up this submission.',
      );
    }

    return this.prisma.oilSubmission.update({
      where: { id: submissionId },
      data: {
        status: SubmissionStatus.picked_up,
      },
    });
  }

  async markInBatch(submissionId: string, userId: string, dto: IMarkInBatchDto) {
    const collectorProfile = await this.prisma.collectorProfile.findUnique({
      where: { userId },
    });

    if (!collectorProfile) {
      throw new NotFoundException('Collector profile not found.');
    }

    const submission = await this.prisma.oilSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found.');
    }

    if (submission.status !== SubmissionStatus.picked_up) {
      throw new BadRequestException(
        `Cannot assign submission with status "${submission.status}". Only picked_up submissions can be added to a batch.`,
      );
    }

    if (submission.collectorId !== collectorProfile.id) {
      throw new ForbiddenException(
        'Only the assigned collector can assign this submission to a batch.',
      );
    }

    const batch = await this.prisma.batch.findUnique({
      where: { id: dto.batchId },
    });

    if (!batch) {
      throw new NotFoundException(`Batch "${dto.batchId}" not found.`);
    }

    // Create BatchItem to link submission to batch, then update status
    const [batchItem, updatedSubmission] = await this.prisma.$transaction([
      this.prisma.batchItem.create({
        data: {
          batchId: dto.batchId,
          submissionId: submissionId,
        },
      }),
      this.prisma.oilSubmission.update({
        where: { id: submissionId },
        data: {
          status: SubmissionStatus.in_batch,
        },
      }),
    ]);

    return updatedSubmission;
  }
}
