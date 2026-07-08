/*
  Warnings:

  - You are about to drop the column `hourlyRate` on the `technician_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "services" ADD COLUMN     "hourlyRate" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "technician_profiles" DROP COLUMN "hourlyRate";
