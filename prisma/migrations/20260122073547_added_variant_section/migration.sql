/*
  Warnings:

  - Added the required column `name` to the `variantsecion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "variant" ADD COLUMN     "price" INTEGER,
ADD COLUMN     "qty" INTEGER;

-- AlterTable
ALTER TABLE "variantsecion" ADD COLUMN     "name" TEXT NOT NULL;
