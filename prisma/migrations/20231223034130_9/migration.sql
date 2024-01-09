/*
  Warnings:

  - You are about to drop the column `promotion_id` on the `Banner` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Banner" DROP CONSTRAINT "Banner_promotion_id_fkey";

-- DropIndex
DROP INDEX "Banner_promotion_id_key";

-- AlterTable
ALTER TABLE "Banner" DROP COLUMN "promotion_id";

-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "banner_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_banner_id_fkey" FOREIGN KEY ("banner_id") REFERENCES "Banner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
