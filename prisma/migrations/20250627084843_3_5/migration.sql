/*
  Warnings:

  - You are about to drop the column `variantId` on the `Orderproduct` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Orderproduct" DROP CONSTRAINT "Orderproduct_variantId_fkey";

-- AlterTable
ALTER TABLE "Orderproduct" DROP COLUMN "variantId";
