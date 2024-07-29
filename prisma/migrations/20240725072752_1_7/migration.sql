/*
  Warnings:

  - Added the required column `name` to the `Varianttemplate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Varianttemplate" ADD COLUMN     "name" TEXT NOT NULL;
