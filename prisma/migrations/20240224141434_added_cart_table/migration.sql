-- AlterTable
ALTER TABLE "Orderproduct" ADD COLUMN     "cartId" INTEGER;

-- CreateTable
CREATE TABLE "Cart" (
    "id" SERIAL NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "price" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Orderproduct" ADD CONSTRAINT "Orderproduct_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE SET NULL ON UPDATE CASCADE;
