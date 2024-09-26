-- CreateEnum
CREATE TYPE "ImgStatus" AS ENUM ('TEMP', 'USED');

-- AlterTable
ALTER TABLE "Productcover" ADD COLUMN     "status" "ImgStatus" NOT NULL DEFAULT 'TEMP';
