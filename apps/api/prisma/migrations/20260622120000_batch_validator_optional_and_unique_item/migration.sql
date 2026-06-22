-- Allow a batch to exist as a collector draft before stakeholder validation.
ALTER TABLE "batches" DROP CONSTRAINT IF EXISTS "batches_validatedBy_fkey";
ALTER TABLE "batches" ALTER COLUMN "validatedBy" DROP NOT NULL;
ALTER TABLE "batches" ADD CONSTRAINT "batches_validatedBy_fkey" FOREIGN KEY ("validatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- A submission can only belong to one batch in the current domain flow.
CREATE UNIQUE INDEX "batch_items_submissionId_key" ON "batch_items"("submissionId");
