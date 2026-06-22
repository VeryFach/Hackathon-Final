import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PayoutStatus, SubmissionStatus } from '@prisma/client';

@Injectable()
export class PayoutsService {
  constructor(private prisma: PrismaService) {}

  async create(submissionId: string) {
    // Step 1: Find submission with required relations
    const submission = await this.prisma.oilSubmission.findUnique({
      where: { id: submissionId },
      include: {
        payout: true,
        batchItems: {
          include: {
            batch: {
              include: {
                batchPricing: true,
              },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found.');
    }

    // Step 2: Validate payout doesn't already exist
    if (submission.payout) {
      throw new BadRequestException(
        'Payout already exists for this submission. Each submission can only have one payout.',
      );
    }

    // Step 3: Validate actualLiter exists
    if (submission.actualLiter === null || submission.actualLiter === undefined) {
      throw new BadRequestException(
        'Submission does not have actual liter data. Actual liter must be recorded before creating payout.',
      );
    }

    if (submission.actualLiter <= 0) {
      throw new BadRequestException(
        'Actual liter must be greater than 0.',
      );
    }

    // Step 4: Get batch through batchItems
    if (!submission.batchItems || submission.batchItems.length === 0) {
      throw new BadRequestException(
        'Submission is not part of any batch. Submission must be added to a batch first.',
      );
    }

    const batchItem = submission.batchItems[0];
    const batch = batchItem.batch;

    // Step 5: Validate batch pricing exists
    if (!batch.batchPricing) {
      throw new BadRequestException(
        'Batch has not been priced yet. Batch pricing must be calculated before creating payout.',
      );
    }

    // Step 6: Calculate payout
    const totalRawOilLiter = batch.totalRawOilLiter;

    if (totalRawOilLiter <= 0) {
      throw new BadRequestException(
        'Batch has no raw oil data. Cannot calculate submission ratio.',
      );
    }

    const submissionRatio = submission.actualLiter / totalRawOilLiter;
    const payoutAmount = batch.batchPricing.totalValue * submissionRatio;

    // Step 7: Create payout
    return this.prisma.payout.create({
      data: {
        submissionId,
        amount: payoutAmount,
        status: PayoutStatus.pending,
      },
    });
  }

  async pay(payoutId: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found.');
    }

    if (payout.status === PayoutStatus.paid) {
      throw new BadRequestException('Payout has already been paid.');
    }

    const [paidPayout] = await this.prisma.$transaction([
      this.prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.paid,
          paidAt: new Date(),
        },
      }),
      this.prisma.oilSubmission.update({
        where: { id: payout.submissionId },
        data: { status: SubmissionStatus.completed },
      }),
    ]);

    return paidPayout;
  }

  async findMine(userId: string) {
    // Find depositor profile for the user
    const depositorProfile = await this.prisma.depositorProfile.findUnique({
      where: { userId },
    });

    if (!depositorProfile) {
      throw new NotFoundException(
        'Depositor profile not found. Please create your depositor profile first.',
      );
    }

    // Find all payouts through submissions owned by this depositor
    return this.prisma.payout.findMany({
      where: {
        submission: {
          depositorId: depositorProfile.id,
        },
      },
      include: {
        submission: {
          include: {
            depositor: {
              include: {
                user: { select: { id: true, fullName: true, email: true } },
              },
            },
            batchItems: {
              include: {
                batch: {
                  include: {
                    batchPricing: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        submission: {
          createdAt: 'desc',
        },
      },
    });
  }

  async findAll() {
    return this.prisma.payout.findMany({
      include: {
        submission: {
          include: {
            depositor: {
              include: {
                user: { select: { id: true, fullName: true, email: true } },
              },
            },
            batchItems: {
              include: {
                batch: {
                  include: {
                    batchPricing: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        submission: {
          createdAt: 'desc',
        },
      },
    });
  }
}
