/*
  Warnings:

  - Added the required column `price` to the `Orderproduct` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Orderproduct" ADD COLUMN     "discount" DECIMAL(65,30),
ADD COLUMN     "price" INTEGER NOT NULL;
