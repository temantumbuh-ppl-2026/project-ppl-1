-- Destructive: back up and verify the database before applying this migration.
-- Removes parent consent/report data and the stored parent email on user accounts.
BEGIN;

ALTER TABLE "parent" DROP CONSTRAINT "parent_userId_fkey";
ALTER TABLE "user" DROP COLUMN "parentEmail";
DROP TABLE "parent";

DROP TYPE "ParentStatus";
DROP TYPE "ReportType";
DROP TYPE "ReportStatus";

COMMIT;
