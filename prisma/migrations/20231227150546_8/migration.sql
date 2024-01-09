-- DropForeignKey
ALTER TABLE "Childcategories" DROP CONSTRAINT "Childcategories_parentcategoriesId_fkey";

-- DropForeignKey
ALTER TABLE "Products" DROP CONSTRAINT "Products_childcategory_id_fkey";

-- AlterTable
ALTER TABLE "Childcategories" ALTER COLUMN "parentcategoriesId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Products" ALTER COLUMN "childcategory_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Childcategories" ADD CONSTRAINT "Childcategories_parentcategoriesId_fkey" FOREIGN KEY ("parentcategoriesId") REFERENCES "Parentcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_childcategory_id_fkey" FOREIGN KEY ("childcategory_id") REFERENCES "Childcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
