/*
  Warnings:

  - Added the required column `orderproduct_id` to the `Cart` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Orderproduct" DROP CONSTRAINT "Orderproduct_cartId_fkey";

-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "orderproduct_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_orderproduct_id_fkey" FOREIGN KEY ("orderproduct_id") REFERENCES "Orderproduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
