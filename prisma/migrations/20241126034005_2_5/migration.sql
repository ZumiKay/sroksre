/*
  Warnings:

  - A unique constraint covering the columns `[promotionId]` on the table `Banner` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[banner_id]` on the table `Promotion` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Promotion" DROP CONSTRAINT "Promotion_banner_id_fkey";

-- AlterTable
ALTER TABLE "Banner" ADD COLUMN     "promotionId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Banner_promotionId_key" ON "Banner"("promotionId");

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_banner_id_key" ON "Promotion"("banner_id");

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_id_fkey" FOREIGN KEY ("id") REFERENCES "Promotion"("banner_id") ON DELETE RESTRICT ON UPDATE CASCADE;
