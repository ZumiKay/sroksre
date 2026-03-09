/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Tempimage` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Tempimage_user_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Tempimage_name_key" ON "Tempimage"("name");

-- CreateIndex
CREATE INDEX "Tempimage_user_id_name_idx" ON "Tempimage"("user_id", "name");
