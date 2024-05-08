/*
  Warnings:

  - Changed the type of `productId` on the `Producttype` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Producttype" DROP CONSTRAINT "Producttype_productId_fkey";

-- AlterTable
ALTER TABLE "Producttype" DROP COLUMN "productId",
ADD COLUMN     "productId" JSONB NOT NULL;
