/*
  Warnings:

  - A unique constraint covering the columns `[availableSlotId]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "availableSlotId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "bookings_availableSlotId_key" ON "bookings"("availableSlotId");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_availableSlotId_fkey" FOREIGN KEY ("availableSlotId") REFERENCES "available_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
