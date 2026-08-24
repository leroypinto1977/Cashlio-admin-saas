-- Count the machines a licence is actually running on.
--
-- Binding was a single `macAddress` column that activation overwrote, so
-- nothing ever counted installations: one licence ran on as many machines as
-- somebody cared to install it on, and the seller had no way to see it. Each
-- machine gets a row now, and maxBranches is enforced against how many of
-- those rows are still in use.
--
-- Releasing a seat keeps the row — a machine that has been replaced is part of
-- the account's history — and stops it counting toward the limit.

CREATE TABLE "LicenseInstall" (
  "id"          TEXT NOT NULL,
  "licenseId"   TEXT NOT NULL,
  "hardwareId"  TEXT NOT NULL,
  "label"       TEXT,
  "branchName"  TEXT,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenIp"  TEXT,
  "releasedAt"  TIMESTAMP(3),
  "releaseNote" TEXT,
  CONSTRAINT "LicenseInstall_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LicenseInstall_licenseId_hardwareId_key"
  ON "LicenseInstall"("licenseId", "hardwareId");
CREATE INDEX "LicenseInstall_licenseId_releasedAt_idx"
  ON "LicenseInstall"("licenseId", "releasedAt");

ALTER TABLE "LicenseInstall"
  ADD CONSTRAINT "LicenseInstall_licenseId_fkey"
  FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Licences already activated keep their seat: the machine they are bound to is
-- carried across so an existing shop is not locked out by the new counting.
INSERT INTO "LicenseInstall" ("id", "licenseId", "hardwareId", "branchName", "firstSeenAt", "lastSeenAt")
SELECT gen_random_uuid(), "id", "macAddress", "branchName",
       COALESCE("activatedAt", CURRENT_TIMESTAMP), COALESCE("lastRefreshAt", CURRENT_TIMESTAMP)
  FROM "License"
 WHERE "macAddress" IS NOT NULL;
