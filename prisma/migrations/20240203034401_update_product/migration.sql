/*
  Warnings:

  - You are about to drop the column `variant_id` on the `stock` table. All the data in the column will be lost.
  - You are about to drop the column `stock_id` on the `variant` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "variant" DROP CONSTRAINT "variant_stock_id_fkey";

-- AlterTable
ALTER TABLE "Products" ADD COLUMN     "stocktype" TEXT NOT NULL DEFAULT 'normal',
ALTER COLUMN "stock" DROP NOT NULL,
ALTER COLUMN "stock" DROP DEFAULT;

-- AlterTable
ALTER TABLE "stock" DROP COLUMN "variant_id";

-- AlterTable
ALTER TABLE "variant" DROP COLUMN "stock_id";
