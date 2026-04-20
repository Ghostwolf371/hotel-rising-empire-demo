-- CreateTable
CREATE TABLE "RoomCheckInCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roomNumber" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" INTEGER NOT NULL,
    "expiresAt" INTEGER NOT NULL,
    "consumedAt" INTEGER
);

-- CreateIndex
CREATE INDEX "RoomCheckInCode_roomNumber_idx" ON "RoomCheckInCode"("roomNumber");

-- CreateIndex
CREATE INDEX "RoomCheckInCode_expiresAt_idx" ON "RoomCheckInCode"("expiresAt");
