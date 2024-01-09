/*
  Warnings:

  - You are about to drop the column `banner_id` on the `Promotion` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `Promotion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Products" ADD COLUMN     "discount" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Promotion" DROP COLUMN "banner_id",
DROP COLUMN "product_id";
