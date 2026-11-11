-- AlterTable
ALTER TABLE "Orders" ADD COLUMN     "paypalCaptureId" TEXT,
ADD COLUMN     "paypalOrderId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Orders_paypalOrderId_key" ON "Orders"("paypalOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Orders_paypalCaptureId_key" ON "Orders"("paypalCaptureId");
