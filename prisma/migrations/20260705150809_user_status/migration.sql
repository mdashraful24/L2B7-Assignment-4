/*
  Warnings:

  - You are about to drop the column `isBanned` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BANNED');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "isBanned",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
