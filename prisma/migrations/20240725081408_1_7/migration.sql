-- DropForeignKey
ALTER TABLE "Varianttemplate" DROP CONSTRAINT "Varianttemplate_variant_id_fkey";

-- AddForeignKey
ALTER TABLE "Varianttemplate" ADD CONSTRAINT "Varianttemplate_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
