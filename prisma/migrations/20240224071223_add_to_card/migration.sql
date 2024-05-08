/*
  Warnings:

  - The primary key for the `Orders` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Orderproduct" DROP CONSTRAINT "Orderproduct_orderId_fkey";

-- AlterTable
ALTER TABLE "Orderproduct" ALTER COLUMN "orderId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Orders" DROP CONSTRAINT "Orders_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Orders_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Orders_id_seq";

-- AddForeignKey
ALTER TABLE "Orderproduct" ADD CONSTRAINT "Orderproduct_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
