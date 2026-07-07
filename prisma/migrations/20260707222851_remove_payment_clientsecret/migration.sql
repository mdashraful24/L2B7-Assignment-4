/*
  Warnings:

  - You are about to drop the column `ClientSecret` on the `payments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payments" DROP COLUMN "ClientSecret";
