/*
  Warnings:

  - You are about to drop the column `isSaved` on the `Productcover` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Productcover` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Productcover" DROP COLUMN "isSaved",
DROP COLUMN "status";
