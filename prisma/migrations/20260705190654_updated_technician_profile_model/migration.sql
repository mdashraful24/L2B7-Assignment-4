-- AlterTable
ALTER TABLE "technician_profiles" ALTER COLUMN "skills" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "experience" DROP NOT NULL,
ALTER COLUMN "hourlyRate" DROP NOT NULL;
