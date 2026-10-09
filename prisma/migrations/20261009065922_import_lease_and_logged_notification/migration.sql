-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'SCREENING_LOGGED';

-- AlterTable
ALTER TABLE "ImportJob" ADD COLUMN     "lockedUntil" TIMESTAMP(3);
