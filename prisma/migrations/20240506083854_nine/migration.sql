/*
  Warnings:

  - You are about to drop the column `producttypeId` on the `Products` table. All the data in the column will be lost.
  - You are about to drop the `_Producttype` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_Producttype" DROP CONSTRAINT "_Producttype_A_fkey";

-- DropForeignKey
ALTER TABLE "_Producttype" DROP CONSTRAINT "_Producttype_B_fkey";

-- AlterTable
ALTER TABLE "Products" DROP COLUMN "producttypeId";

-- DropTable
DROP TABLE "_Producttype";

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_relatedproductId_fkey" FOREIGN KEY ("relatedproductId") REFERENCES "Producttype"("id") ON DELETE SET NULL ON UPDATE CASCADE;
