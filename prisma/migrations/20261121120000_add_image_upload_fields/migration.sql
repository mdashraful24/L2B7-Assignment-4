-- AlterTable
ALTER TABLE "users" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "imagePublicId" TEXT;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "serviceImagePublicId" TEXT;
