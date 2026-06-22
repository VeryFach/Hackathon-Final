/*
  Warnings:

  - The values [admin,user] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('pending', 'accepted', 'picked_up', 'in_batch', 'completed');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('draft', 'sent', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "OilGrade" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'paid');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('stakeholder', 'masyarakat', 'pengepul');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

-- CreateTable
CREATE TABLE "depositor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "depositor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collector_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "warehouse_address" TEXT NOT NULL,
    "service_radius_km" DOUBLE PRECISION NOT NULL,
    "capacity_liter" INTEGER NOT NULL,

    CONSTRAINT "collector_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oil_submissions" (
    "id" TEXT NOT NULL,
    "estimated_liter" DOUBLE PRECISION NOT NULL,
    "actual_liter" DOUBLE PRECISION,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'pending',
    "depositorId" TEXT NOT NULL,
    "collectorId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oil_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" TEXT NOT NULL,
    "collectorId" TEXT NOT NULL,
    "validatedBy" TEXT NOT NULL,
    "total_raw_oil_liter" DOUBLE PRECISION NOT NULL,
    "total_clean_oil_liter" DOUBLE PRECISION NOT NULL,
    "residue_liter" DOUBLE PRECISION NOT NULL,
    "sediment_ratio" DECIMAL(5,4) NOT NULL,
    "yield_ratio" DECIMAL(5,4) NOT NULL,
    "total_liter" DOUBLE PRECISION NOT NULL,
    "status" "BatchStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_items" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,

    CONSTRAINT "batch_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_results" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "acidity_level" DOUBLE PRECISION NOT NULL,
    "impurity_level" DOUBLE PRECISION NOT NULL,
    "water_content" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "grade" "OilGrade" NOT NULL,
    "tested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricings" (
    "id" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_rules" (
    "id" TEXT NOT NULL,
    "pricingId" TEXT NOT NULL,
    "grade" "OilGrade" NOT NULL,
    "base_price" DOUBLE PRECISION NOT NULL,
    "quality_factor" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "grade_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volume_rules" (
    "id" TEXT NOT NULL,
    "pricingId" TEXT NOT NULL,
    "min_volume" DOUBLE PRECISION NOT NULL,
    "max_volume" DOUBLE PRECISION,
    "bonus_factor" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "volume_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_pricings" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "pricingId" TEXT NOT NULL,
    "final_price_per_liter" DOUBLE PRECISION NOT NULL,
    "total_value" DOUBLE PRECISION NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_pricings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PayoutStatus" NOT NULL,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "depositor_profiles_userId_key" ON "depositor_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "collector_profiles_userId_key" ON "collector_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "lab_results_batchId_key" ON "lab_results"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "batch_pricings_batchId_key" ON "batch_pricings"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_submissionId_key" ON "payouts"("submissionId");

-- AddForeignKey
ALTER TABLE "depositor_profiles" ADD CONSTRAINT "depositor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collector_profiles" ADD CONSTRAINT "collector_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oil_submissions" ADD CONSTRAINT "oil_submissions_depositorId_fkey" FOREIGN KEY ("depositorId") REFERENCES "depositor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oil_submissions" ADD CONSTRAINT "oil_submissions_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "collector_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "collector_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_validatedBy_fkey" FOREIGN KEY ("validatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_items" ADD CONSTRAINT "batch_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_items" ADD CONSTRAINT "batch_items_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "oil_submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pricings" ADD CONSTRAINT "pricings_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_rules" ADD CONSTRAINT "grade_rules_pricingId_fkey" FOREIGN KEY ("pricingId") REFERENCES "pricings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volume_rules" ADD CONSTRAINT "volume_rules_pricingId_fkey" FOREIGN KEY ("pricingId") REFERENCES "pricings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_pricings" ADD CONSTRAINT "batch_pricings_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_pricings" ADD CONSTRAINT "batch_pricings_pricingId_fkey" FOREIGN KEY ("pricingId") REFERENCES "pricings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "oil_submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
