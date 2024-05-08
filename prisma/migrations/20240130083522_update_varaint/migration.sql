-- CreateTable
CREATE TABLE "variant" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "option_title" TEXT NOT NULL,
    "option_value" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,

    CONSTRAINT "variant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "variant_product_id_option_title_option_value_key" ON "variant"("product_id", "option_title", "option_value");

-- AddForeignKey
ALTER TABLE "variant" ADD CONSTRAINT "variant_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
