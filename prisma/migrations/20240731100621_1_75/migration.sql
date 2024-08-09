/*
  Warnings:

  - Changed the type of `variant_val` on the `stock` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "stock" DROP COLUMN "variant_val",
ADD COLUMN     "variant_val" JSONB NOT NULL;
