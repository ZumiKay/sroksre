-- DropForeignKey
ALTER TABLE "Orderproduct" DROP CONSTRAINT "Orderproduct_orderId_fkey";

-- AlterTable
ALTER TABLE "Orderproduct" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Orders" ADD COLUMN     "renewedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Orderproduct_createdAt_idx" ON "Orderproduct"("createdAt");

-- AddForeignKey
ALTER TABLE "Orderproduct" ADD CONSTRAINT "Orderproduct_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
