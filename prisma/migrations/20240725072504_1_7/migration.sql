-- CreateTable
CREATE TABLE "Varianttemplate" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "variant_id" INTEGER NOT NULL,

    CONSTRAINT "Varianttemplate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Varianttemplate" ADD CONSTRAINT "Varianttemplate_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
