-- DropForeignKey
ALTER TABLE "variant" DROP CONSTRAINT "variant_sectionId_fkey";

-- DropForeignKey
ALTER TABLE "variantsecion" DROP CONSTRAINT "variantsecion_productsId_fkey";

-- AddForeignKey
ALTER TABLE "variant" ADD CONSTRAINT "variant_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "variantsecion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantsecion" ADD CONSTRAINT "variantsecion_productsId_fkey" FOREIGN KEY ("productsId") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
