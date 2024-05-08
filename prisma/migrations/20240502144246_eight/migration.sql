/*
  Warnings:

  - You are about to drop the column `price` on the `stock` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Address" DROP CONSTRAINT "Address_userId_fkey";

-- AlterTable
ALTER TABLE "stock" DROP COLUMN "price";

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
