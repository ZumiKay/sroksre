/*
  Warnings:

  - You are about to drop the column `banner_id` on the `Promotion` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Banner" DROP CONSTRAINT "Banner_id_fkey";

-- DropIndex
DROP INDEX "Promotion_banner_id_key";

-- AlterTable
ALTER TABLE "Promotion" DROP COLUMN "banner_id";

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
