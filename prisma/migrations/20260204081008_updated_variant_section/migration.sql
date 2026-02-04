-- DropForeignKey
ALTER TABLE "variant" DROP CONSTRAINT "variant_sectionId_fkey";

-- AddForeignKey
ALTER TABLE "variant" ADD CONSTRAINT "variant_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "variantsecion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
