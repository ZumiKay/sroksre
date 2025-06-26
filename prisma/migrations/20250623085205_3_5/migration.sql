/*
  Warnings:

  - You are about to drop the column `details` on the `Orderproduct` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Orderproduct" DROP COLUMN "details",
ADD COLUMN     "stock_selected_id" INTEGER,
ADD COLUMN     "variantId" INTEGER;

-- CreateTable
CREATE TABLE "OrderproductVariant" (
    "id" SERIAL NOT NULL,
    "variantId" INTEGER NOT NULL,
    "orderproductId" INTEGER,

    CONSTRAINT "OrderproductVariant_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Orderproduct" ADD CONSTRAINT "Orderproduct_stock_selected_id_fkey" FOREIGN KEY ("stock_selected_id") REFERENCES "Stockvalue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orderproduct" ADD CONSTRAINT "Orderproduct_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "variant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderproductVariant" ADD CONSTRAINT "OrderproductVariant_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderproductVariant" ADD CONSTRAINT "OrderproductVariant_orderproductId_fkey" FOREIGN KEY ("orderproductId") REFERENCES "Orderproduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
