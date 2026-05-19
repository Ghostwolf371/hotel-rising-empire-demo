-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceSrd" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "image" TEXT NOT NULL DEFAULT '',
    "available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sessionStartedAt" BIGINT,
    "sessionEndsAt" BIGINT,
    "durationHours" INTEGER,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,

    CONSTRAINT "OrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PanicAlert" (
    "id" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "at" BIGINT NOT NULL,

    CONSTRAINT "PanicAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestRating" (
    "id" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "submittedAt" BIGINT NOT NULL,
    "cleanliness" INTEGER NOT NULL,
    "comfort" INTEGER NOT NULL,
    "service" INTEGER NOT NULL,

    CONSTRAINT "GuestRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "hourlyRate" INTEGER NOT NULL DEFAULT 75,

    CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomCheckInCode" (
    "id" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" BIGINT NOT NULL,
    "expiresAt" BIGINT NOT NULL,
    "consumedAt" BIGINT,

    CONSTRAINT "RoomCheckInCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_number_key" ON "Room"("number");

-- CreateIndex
CREATE INDEX "OrderLine_orderId_idx" ON "OrderLine"("orderId");

-- CreateIndex
CREATE INDEX "RoomCheckInCode_roomNumber_idx" ON "RoomCheckInCode"("roomNumber");

-- CreateIndex
CREATE INDEX "RoomCheckInCode_expiresAt_idx" ON "RoomCheckInCode"("expiresAt");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
