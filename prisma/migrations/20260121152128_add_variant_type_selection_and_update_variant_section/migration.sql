/*
  Warnings:

  - You are about to drop the column `sectionId` on the `variant` table. All the data in the column will be lost.
  - You are about to drop the `VariantSection` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VariantSection" DROP CONSTRAINT "VariantSection_productsId_fkey";

-- DropForeignKey
ALTER TABLE "variant" DROP CONSTRAINT "variant_variantSectionId_fkey";

-- AlterTable
ALTER TABLE "variant" DROP COLUMN "sectionId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "VariantSection";

-- CreateTable
CREATE TABLE "variant_section" (
    "id" SERIAL NOT NULL,
    "strId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productsId" INTEGER,
    "variantTypeSelectionId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variant_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_type_selection" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "allowedTypes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variant_type_selection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "variant_section_strId_key" ON "variant_section"("strId");

-- CreateIndex
CREATE UNIQUE INDEX "variant_type_selection_name_key" ON "variant_type_selection"("name");

-- AddForeignKey
ALTER TABLE "variant" ADD CONSTRAINT "variant_variantSectionId_fkey" FOREIGN KEY ("variantSectionId") REFERENCES "variant_section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_section" ADD CONSTRAINT "variant_section_productsId_fkey" FOREIGN KEY ("productsId") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_section" ADD CONSTRAINT "variant_section_variantTypeSelectionId_fkey" FOREIGN KEY ("variantTypeSelectionId") REFERENCES "variant_type_selection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
