/*
  Warnings:

  - You are about to drop the `Productcover` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tempimage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Productcover" DROP CONSTRAINT "Productcover_productId_fkey";

-- DropForeignKey
ALTER TABLE "Tempimage" DROP CONSTRAINT "Tempimage_user_id_fkey";

-- DropTable
DROP TABLE "Productcover";

-- DropTable
DROP TABLE "Tempimage";

-- CreateTable
CREATE TABLE "Image" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "productId" INTEGER,
    "bannerId" INTEGER,
    "temp" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_bannerId_fkey" FOREIGN KEY ("bannerId") REFERENCES "Banner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
