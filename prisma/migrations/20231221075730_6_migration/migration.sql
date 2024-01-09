/*
  Warnings:

  - You are about to drop the column `descrition` on the `product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "product" DROP COLUMN "descrition",
ADD COLUMN     "description" TEXT NOT NULL DEFAULT '';
