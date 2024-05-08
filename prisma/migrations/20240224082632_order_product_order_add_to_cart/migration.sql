/*
  Warnings:

  - You are about to drop the column `quantity` on the `Orders` table. All the data in the column will be lost.
  - Added the required column `price` to the `Orderproduct` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Orderproduct" ADD COLUMN     "discount" JSONB,
ADD COLUMN     "price" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Orders" DROP COLUMN "quantity",
ADD COLUMN     "price" JSONB NOT NULL;
