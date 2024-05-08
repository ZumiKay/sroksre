/*
  Warnings:

  - You are about to drop the column `banner_id` on the `Tempimage` table. All the data in the column will be lost.
  - You are about to drop the column `productcover_id` on the `Tempimage` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Tempimage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Tempimage" DROP COLUMN "banner_id",
DROP COLUMN "productcover_id",
DROP COLUMN "type";
