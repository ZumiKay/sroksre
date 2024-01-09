/*
  Warnings:

  - You are about to drop the column `color` on the `Banner` table. All the data in the column will be lost.
  - The `info_value` column on the `Info` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Products` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `image` on the `Banner` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `info_type` on the `Info` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Info" DROP CONSTRAINT "Info_product_id_fkey";

-- DropForeignKey
ALTER TABLE "Products" DROP CONSTRAINT "Products_category_id_fkey";

-- DropForeignKey
ALTER TABLE "Products" DROP CONSTRAINT "Products_order_id_fkey";

-- DropForeignKey
ALTER TABLE "Products" DROP CONSTRAINT "Products_promotion_id_fkey";

-- DropForeignKey
ALTER TABLE "Products" DROP CONSTRAINT "Products_seller_id_fkey";

-- DropForeignKey
ALTER TABLE "Reviews" DROP CONSTRAINT "Reviews_product_id_fkey";

-- AlterTable
ALTER TABLE "Banner" DROP COLUMN "color",
DROP COLUMN "image",
ADD COLUMN     "image" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Info" DROP COLUMN "info_value",
ADD COLUMN     "info_value" TEXT[],
ALTER COLUMN "product_id" DROP NOT NULL,
DROP COLUMN "info_type",
ADD COLUMN     "info_type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "lastname" DROP NOT NULL;

-- DropTable
DROP TABLE "Categories";

-- DropTable
DROP TABLE "Products";

-- DropEnum
DROP TYPE "InfoType";

-- DropEnum
DROP TYPE "bannertype";

-- CreateTable
CREATE TABLE "parentcateogries" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "parentcateogries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "childcategories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "parentcategoriesId" INTEGER,

    CONSTRAINT "childcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "descrition" TEXT NOT NULL DEFAULT '',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "category_id" INTEGER NOT NULL,
    "order_id" TEXT,
    "review_id" INTEGER,
    "promotion_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_cover" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "product_cover_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "childcategories" ADD CONSTRAINT "childcategories_parentcategoriesId_fkey" FOREIGN KEY ("parentcategoriesId") REFERENCES "parentcateogries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "parentcateogries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_cover" ADD CONSTRAINT "product_cover_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Info" ADD CONSTRAINT "Info_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
