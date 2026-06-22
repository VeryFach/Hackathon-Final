-- DropForeignKey
ALTER TABLE "oil_submissions" DROP CONSTRAINT "oil_submissions_collectorId_fkey";

-- AlterTable
ALTER TABLE "oil_submissions" ALTER COLUMN "collectorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "oil_submissions" ADD CONSTRAINT "oil_submissions_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "collector_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
