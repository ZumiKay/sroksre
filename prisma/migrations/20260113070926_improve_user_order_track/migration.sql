/*
  Warnings:

  - A unique constraint covering the columns `[buyer_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - The required column `buyer_id` was added to the `User` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Orders" DROP CONSTRAINT "Orders_buyer_id_fkey";

-- AlterTable
ALTER TABLE "Orders" ALTER COLUMN "buyer_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "buyer_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_buyer_id_key" ON "User"("buyer_id");

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "User"("buyer_id") ON DELETE CASCADE ON UPDATE CASCADE;
