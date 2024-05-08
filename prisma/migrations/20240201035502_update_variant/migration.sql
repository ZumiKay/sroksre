/*
  Warnings:

  - The `option_value` column on the `variant` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `stock_id` to the `variant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "stock" ADD COLUMN     "variant_val" TEXT[];

-- AlterTable
ALTER TABLE "variant" ADD COLUMN     "stock_id" INTEGER NOT NULL,
DROP COLUMN "option_value",
ADD COLUMN     "option_value" TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "variant_product_id_option_title_option_value_key" ON "variant"("product_id", "option_title", "option_value");

-- AddForeignKey
ALTER TABLE "variant" ADD CONSTRAINT "variant_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
