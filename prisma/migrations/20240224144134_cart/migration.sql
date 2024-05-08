/*
  Warnings:

  - You are about to drop the column `cartId` on the `Orderproduct` table. All the data in the column will be lost.
  - You are about to drop the `Cart` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `user_id` to the `Orderproduct` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_orderproduct_id_fkey";

-- DropForeignKey
ALTER TABLE "Orderproduct" DROP CONSTRAINT "Orderproduct_orderId_fkey";

-- AlterTable
ALTER TABLE "Orderproduct" DROP COLUMN "cartId",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'incart',
ADD COLUMN     "user_id" INTEGER NOT NULL,
ALTER COLUMN "orderId" DROP NOT NULL;

-- DropTable
DROP TABLE "Cart";

-- AddForeignKey
ALTER TABLE "Orderproduct" ADD CONSTRAINT "Orderproduct_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orderproduct" ADD CONSTRAINT "Orderproduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
