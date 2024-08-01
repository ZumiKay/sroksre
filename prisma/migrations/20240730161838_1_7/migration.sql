/*
  Warnings:

  - Changed the type of `option_value` on the `variant` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "variant" DROP COLUMN "option_value",
ADD COLUMN     "option_value" JSONB NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "variant_option_title_option_value_key" ON "variant"("option_title", "option_value");
