-- DropForeignKey
ALTER TABLE "Products" DROP CONSTRAINT "Products_parentcategory_id_fkey";

-- AlterTable
ALTER TABLE "Products" ALTER COLUMN "parentcategory_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_parentcategory_id_fkey" FOREIGN KEY ("parentcategory_id") REFERENCES "Parentcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
