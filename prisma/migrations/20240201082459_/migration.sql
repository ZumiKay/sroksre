-- DropForeignKey
ALTER TABLE "variant" DROP CONSTRAINT "variant_product_id_fkey";

-- AlterTable
ALTER TABLE "variant" ALTER COLUMN "product_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "variant" ADD CONSTRAINT "variant_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
