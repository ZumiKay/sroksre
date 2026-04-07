-- AlterTable
ALTER TABLE "variant" ADD COLUMN     "optional" BOOLEAN,
ADD COLUMN     "sectionId" TEXT,
ADD COLUMN     "variantSectionId" INTEGER;

-- CreateTable
CREATE TABLE "VariantSection" (
    "id" SERIAL NOT NULL,
    "strId" TEXT NOT NULL,
    "productsId" INTEGER,

    CONSTRAINT "VariantSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VariantSection_strId_key" ON "VariantSection"("strId");

-- AddForeignKey
ALTER TABLE "variant" ADD CONSTRAINT "variant_variantSectionId_fkey" FOREIGN KEY ("variantSectionId") REFERENCES "VariantSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantSection" ADD CONSTRAINT "VariantSection_productsId_fkey" FOREIGN KEY ("productsId") REFERENCES "Products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
