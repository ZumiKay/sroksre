-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
