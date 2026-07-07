/*
  Warnings:

  - You are about to drop the column `endTime` on the `available_slots` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `available_slots` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[technicianId,dayOfWeek,startAt,endAt]` on the table `available_slots` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `endAt` to the `available_slots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startAt` to the `available_slots` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "available_slots_technicianId_dayOfWeek_startTime_endTime_key";

-- AlterTable
ALTER TABLE "available_slots" DROP COLUMN "endTime",
DROP COLUMN "startTime",
ADD COLUMN     "endAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "available_slots_technicianId_dayOfWeek_startAt_endAt_key" ON "available_slots"("technicianId", "dayOfWeek", "startAt", "endAt");
