-- AlterTable
ALTER TABLE "ManagementUser" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'staff';

-- Existing accounts had full access before roles existed.
UPDATE "ManagementUser" SET "role" = 'admin';
