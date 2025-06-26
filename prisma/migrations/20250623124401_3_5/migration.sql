-- DropForeignKey
ALTER TABLE "OrderproductVariant" DROP CONSTRAINT "OrderproductVariant_orderproductId_fkey";

-- AddForeignKey
ALTER TABLE "OrderproductVariant" ADD CONSTRAINT "OrderproductVariant_orderproductId_fkey" FOREIGN KEY ("orderproductId") REFERENCES "Orderproduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
