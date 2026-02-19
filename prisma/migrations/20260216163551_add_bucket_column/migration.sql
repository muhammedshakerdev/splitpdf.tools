/*
  Warnings:

  - Added the required column `bucket` to the `file` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "file" ADD COLUMN     "bucket" TEXT NOT NULL;
