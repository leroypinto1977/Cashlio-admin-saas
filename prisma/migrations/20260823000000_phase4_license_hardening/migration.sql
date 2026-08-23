-- AlterTable
ALTER TABLE "License" ADD COLUMN     "gracePeriodDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "lastRefreshAt" TIMESTAMP(3),
ADD COLUMN     "lastRefreshIp" TEXT,
ADD COLUMN     "refreshTokenSeq" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "revokeReason" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3);

