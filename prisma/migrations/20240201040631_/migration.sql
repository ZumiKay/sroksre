-- DropForeignKey
ALTER TABLE "variant" DROP CONSTRAINT "variant_stock_id_fkey";

-- AlterTable
ALTER TABLE "variant" ALTER COLUMN "stock_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "variant" ADD CONSTRAINT "variant_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "stock"("id") ON DELETE SET NULL ON UPDATE CASCADE;
