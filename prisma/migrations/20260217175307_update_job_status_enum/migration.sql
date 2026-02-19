/*
  Warnings:

  - The values [WAITING] on the enum `JobStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "JobStatus_new" AS ENUM ('PENDING', 'ENQUEUED', 'PROCESSING', 'DONE', 'FAILED');
ALTER TABLE "job" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "job" ALTER COLUMN "status" TYPE "JobStatus_new" USING ("status"::text::"JobStatus_new");
ALTER TYPE "JobStatus" RENAME TO "JobStatus_old";
ALTER TYPE "JobStatus_new" RENAME TO "JobStatus";
DROP TYPE "JobStatus_old";
ALTER TABLE "job" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "job" ALTER COLUMN "status" SET DEFAULT 'PENDING';
