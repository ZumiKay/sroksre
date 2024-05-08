/*
  Warnings:

  - A unique constraint covering the columns `[option_title,option_value]` on the table `variant` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "stock_product_id_key";

-- DropIndex
DROP INDEX "variant_product_id_option_title_option_value_key";

-- CreateIndex
CREATE UNIQUE INDEX "variant_option_title_option_value_key" ON "variant"("option_title", "option_value");
