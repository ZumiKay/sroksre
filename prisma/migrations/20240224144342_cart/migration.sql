/*
  Warnings:

  - You are about to drop the column `discount` on the `Orderproduct` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Orderproduct` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Orderproduct" DROP COLUMN "discount",
DROP COLUMN "price",
ALTER COLUMN "user_id" SET DATA TYPE TEXT;
