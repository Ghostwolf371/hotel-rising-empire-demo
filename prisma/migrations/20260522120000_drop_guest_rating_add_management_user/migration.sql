-- DropTable
DROP TABLE IF EXISTS "GuestRating";

-- CreateTable
CREATE TABLE "ManagementUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" BIGINT NOT NULL,

    CONSTRAINT "ManagementUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ManagementUser_email_key" ON "ManagementUser"("email");
