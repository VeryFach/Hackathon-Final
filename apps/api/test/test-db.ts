import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * Shared Prisma client for e2e test cleanup.
 * Uses the same adapter pattern as PrismaService.
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set for e2e tests');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/**
 * Delete all records from every table in the database (in dependency order)
 * so each test suite starts with a clean slate.
 */
export async function cleanDatabase(): Promise<void> {
  await prisma.batchPricing.deleteMany();
  await prisma.labResult.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.batchItem.deleteMany();
  await prisma.oilSubmission.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.gradeRule.deleteMany();
  await prisma.volumeRule.deleteMany();
  await prisma.pricing.deleteMany();
  await prisma.depositorProfile.deleteMany();
  await prisma.collectorProfile.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Disconnect the cleanup client.
 */
export async function disconnectTestDb(): Promise<void> {
  await prisma.$disconnect();
}
