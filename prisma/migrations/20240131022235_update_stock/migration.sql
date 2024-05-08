/*
  Warnings:

  - You are about to drop the column `stock` on the `variant` table. All the data in the column will be lost.
  - Added the required column `option_type` to the `variant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "variant" DROP COLUMN "stock",
ADD COLUMN     "option_type" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "stock" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "variant_id" INTEGER[],

    CONSTRAINT "stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_product_id_key" ON "stock"("product_id");

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
