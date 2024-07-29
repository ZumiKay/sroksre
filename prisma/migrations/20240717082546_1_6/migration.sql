/*
  Warnings:

  - You are about to drop the `Autocategory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Productcategory" DROP CONSTRAINT "Productcategory_autocategory_id_fkey";

-- DropTable
DROP TABLE "Autocategory";

-- AddForeignKey
ALTER TABLE "Productcategory" ADD CONSTRAINT "Productcategory_autocategory_id_fkey" FOREIGN KEY ("autocategory_id") REFERENCES "Parentcategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
