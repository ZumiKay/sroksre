/*
  Warnings:

  - You are about to drop the column `image` on the `Banner` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bannerId]` on the table `Image` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Banner" DROP COLUMN "image";

-- CreateIndex
CREATE UNIQUE INDEX "Image_bannerId_key" ON "Image"("bannerId");
