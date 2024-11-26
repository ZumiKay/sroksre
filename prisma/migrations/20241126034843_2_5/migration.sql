-- DropForeignKey
ALTER TABLE "Containeritems" DROP CONSTRAINT "Containeritems_banner_id_fkey";

-- DropForeignKey
ALTER TABLE "Containeritems" DROP CONSTRAINT "Containeritems_homecontainerId_fkey";

-- DropForeignKey
ALTER TABLE "Containeritems" DROP CONSTRAINT "Containeritems_product_id_fkey";

-- AddForeignKey
ALTER TABLE "Containeritems" ADD CONSTRAINT "Containeritems_banner_id_fkey" FOREIGN KEY ("banner_id") REFERENCES "Banner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Containeritems" ADD CONSTRAINT "Containeritems_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Containeritems" ADD CONSTRAINT "Containeritems_homecontainerId_fkey" FOREIGN KEY ("homecontainerId") REFERENCES "Homecontainer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
