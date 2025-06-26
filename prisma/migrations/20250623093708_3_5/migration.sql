/*
  Warnings:

  - Added the required column `variantIdx` to the `OrderproductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderproductVariant" ADD COLUMN     "variantIdx" INTEGER NOT NULL;
