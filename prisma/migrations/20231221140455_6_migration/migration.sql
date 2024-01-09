/*
  Warnings:

  - You are about to drop the `childcategories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `parentcateogries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_cover` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Info" DROP CONSTRAINT "Info_product_id_fkey";

-- DropForeignKey
ALTER TABLE "Reviews" DROP CONSTRAINT "Reviews_product_id_fkey";

-- DropForeignKey
ALTER TABLE "childcategories" DROP CONSTRAINT "childcategories_parentcategoriesId_fkey";

-- DropForeignKey
ALTER TABLE "product" DROP CONSTRAINT "product_category_id_fkey";

-- DropForeignKey
ALTER TABLE "product" DROP CONSTRAINT "product_order_id_fkey";

-- DropForeignKey
ALTER TABLE "product" DROP CONSTRAINT "product_promotion_id_fkey";

-- DropForeignKey
ALTER TABLE "product" DROP CONSTRAINT "product_userId_fkey";

-- DropForeignKey
ALTER TABLE "product_cover" DROP CONSTRAINT "product_cover_productId_fkey";

-- DropTable
DROP TABLE "childcategories";

-- DropTable
DROP TABLE "parentcateogries";

-- DropTable
DROP TABLE "product";

-- DropTable
DROP TABLE "product_cover";

-- CreateTable
CREATE TABLE "Parentcategories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Parentcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Childcategories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "parentcategoriesId" INTEGER NOT NULL,

    CONSTRAINT "Childcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Products" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "description" TEXT NOT NULL DEFAULT '',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "parentcategory_id" INTEGER NOT NULL,
    "childcategory_id" INTEGER NOT NULL,
    "order_id" TEXT,
    "review_id" INTEGER,
    "promotion_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "Products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Productcover" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "Productcover_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Childcategories" ADD CONSTRAINT "Childcategories_parentcategoriesId_fkey" FOREIGN KEY ("parentcategoriesId") REFERENCES "Parentcategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_parentcategory_id_fkey" FOREIGN KEY ("parentcategory_id") REFERENCES "Parentcategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_childcategory_id_fkey" FOREIGN KEY ("childcategory_id") REFERENCES "Childcategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Productcover" ADD CONSTRAINT "Productcover_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Info" ADD CONSTRAINT "Info_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
