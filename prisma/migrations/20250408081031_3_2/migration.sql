-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "userId" INTEGER;

-- CreateIndex
CREATE INDEX "Banner_id_name_type_idx" ON "Banner"("id", "name", "type");

-- CreateIndex
CREATE INDEX "Image_id_name_idx" ON "Image"("id", "name");

-- CreateIndex
CREATE INDEX "Notification_id_type_idx" ON "Notification"("id", "type");

-- CreateIndex
CREATE INDEX "Orders_id_status_createdAt_idx" ON "Orders"("id", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Paragraph_id_idx" ON "Paragraph"("id");

-- CreateIndex
CREATE INDEX "Products_id_name_parentcategory_id_childcategory_id_idx" ON "Products"("id", "name", "parentcategory_id", "childcategory_id");

-- CreateIndex
CREATE INDEX "Promotion_id_name_expireAt_idx" ON "Promotion"("id", "name", "expireAt");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
