-- AlterTable
ALTER TABLE "Orders" ADD COLUMN     "shipping_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_shipping_id_fkey" FOREIGN KEY ("shipping_id") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
