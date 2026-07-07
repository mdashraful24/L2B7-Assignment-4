/*
  Warnings:

  - You are about to drop the column `scheduledDate` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledTime` on the `bookings` table. All the data in the column will be lost.
  - Added the required column `scheduledAt` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "scheduledDate",
DROP COLUMN "scheduledTime",
ADD COLUMN     "scheduledAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "bookings_scheduledAt_idx" ON "bookings"("scheduledAt");
