-- CreateEnum
CREATE TYPE "Imagetemptype" AS ENUM ('COVER', 'BANNER');

-- AlterTable
ALTER TABLE "Products" ALTER COLUMN "stocktype" SET DEFAULT 'stock';

-- CreateTable
CREATE TABLE "Tempimage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "Imagetemptype" NOT NULL,
    "productcover_id" INTEGER,
    "banner_id" INTEGER,

    CONSTRAINT "Tempimage_pkey" PRIMARY KEY ("id")
);
