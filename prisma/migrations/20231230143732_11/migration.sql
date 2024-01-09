/*
  Warnings:

  - Made the column `isSaved` on table `Productcover` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Productcover" ALTER COLUMN "isSaved" SET NOT NULL;
