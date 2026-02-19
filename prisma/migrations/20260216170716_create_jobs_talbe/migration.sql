-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('WAITING', 'PROCESSING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "job" (
    "id" UUID NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'WAITING',
    "fileId" UUID NOT NULL,
    "splits" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "job" ADD CONSTRAINT "job_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;
