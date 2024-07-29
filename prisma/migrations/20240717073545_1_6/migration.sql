/*
  Warnings:

  - You are about to drop the column `customcategories` on the `Products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Products" DROP COLUMN "customcategories";

-- CreateTable
CREATE TABLE "Autocategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Autocategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Productcategory" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "autocategory_id" INTEGER NOT NULL,

    CONSTRAINT "Productcategory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Productcategory" ADD CONSTRAINT "Productcategory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Productcategory" ADD CONSTRAINT "Productcategory_autocategory_id_fkey" FOREIGN KEY ("autocategory_id") REFERENCES "Autocategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
