/*
  Warnings:

  - You are about to drop the column `variant_val` on the `stock` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "stock" DROP CONSTRAINT "stock_product_id_fkey";

-- DropForeignKey
ALTER TABLE "variant" DROP CONSTRAINT "variant_product_id_fkey";

-- AlterTable
ALTER TABLE "stock" DROP COLUMN "variant_val";

-- CreateTable
CREATE TABLE "Stockvalue" (
    "id" SERIAL NOT NULL,
    "qty" INTEGER NOT NULL,
    "variant_val" JSONB NOT NULL,
    "stockId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stockvalue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "variant" ADD CONSTRAINT "variant_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stockvalue" ADD CONSTRAINT "Stockvalue_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
