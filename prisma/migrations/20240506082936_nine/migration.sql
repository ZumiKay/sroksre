-- DropForeignKey
ALTER TABLE "Products" DROP CONSTRAINT "Products_relatedproductId_fkey";

-- AlterTable
ALTER TABLE "Products" ADD COLUMN     "producttypeId" INTEGER;

-- CreateTable
CREATE TABLE "_Producttype" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_Producttype_AB_unique" ON "_Producttype"("A", "B");

-- CreateIndex
CREATE INDEX "_Producttype_B_index" ON "_Producttype"("B");

-- AddForeignKey
ALTER TABLE "_Producttype" ADD CONSTRAINT "_Producttype_A_fkey" FOREIGN KEY ("A") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Producttype" ADD CONSTRAINT "_Producttype_B_fkey" FOREIGN KEY ("B") REFERENCES "Producttype"("id") ON DELETE CASCADE ON UPDATE CASCADE;
