-- DropForeignKey
ALTER TABLE "Products" DROP CONSTRAINT "Products_order_id_fkey";

-- DropForeignKey
ALTER TABLE "Products" DROP CONSTRAINT "Products_promotion_id_fkey";

-- AlterTable
ALTER TABLE "Products" ALTER COLUMN "order_id" DROP NOT NULL,
ALTER COLUMN "review_id" DROP NOT NULL,
ALTER COLUMN "promotion_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
