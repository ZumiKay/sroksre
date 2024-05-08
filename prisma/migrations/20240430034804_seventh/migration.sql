/*
  Warnings:

  - You are about to alter the column `price` on the `Products` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to alter the column `discount` on the `Products` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "Products" ALTER COLUMN "price" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "discount" SET DATA TYPE DOUBLE PRECISION;
