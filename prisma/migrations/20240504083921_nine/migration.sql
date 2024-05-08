-- AlterTable
ALTER TABLE "Products" ADD COLUMN     "relatedproductId" INTEGER;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_relatedproductId_fkey" FOREIGN KEY ("relatedproductId") REFERENCES "Producttype"("id") ON DELETE SET NULL ON UPDATE CASCADE;
