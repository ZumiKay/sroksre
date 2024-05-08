-- CreateTable
CREATE TABLE "Producttype" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "Producttype_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Producttype" ADD CONSTRAINT "Producttype_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
