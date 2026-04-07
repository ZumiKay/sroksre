/*
  Warnings:

  - You are about to drop the column `createdAt` on the `variant` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `variant` table. All the data in the column will be lost.
  - You are about to drop the column `variantSectionId` on the `variant` table. All the data in the column will be lost.
  - You are about to drop the `variant_section` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `variant_type_selection` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[product_id,autocategory_id]` on the table `Productcategory` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[uid,pid]` on the table `Wishlist` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "variant" DROP CONSTRAINT "variant_variantSectionId_fkey";

-- DropForeignKey
ALTER TABLE "variant_section" DROP CONSTRAINT "variant_section_productsId_fkey";

-- DropForeignKey
ALTER TABLE "variant_section" DROP CONSTRAINT "variant_section_variantTypeSelectionId_fkey";

-- AlterTable
ALTER TABLE "variant" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
DROP COLUMN "variantSectionId",
ADD COLUMN     "sectionId" INTEGER;

-- DropTable
DROP TABLE "variant_section";

-- DropTable
DROP TABLE "variant_type_selection";

-- CreateTable
CREATE TABLE "variantsecion" (
    "id" SERIAL NOT NULL,
    "productsId" INTEGER,

    CONSTRAINT "variantsecion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "variantsecion_productsId_idx" ON "variantsecion"("productsId");

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "Address"("userId");

-- CreateIndex
CREATE INDEX "Address_province_idx" ON "Address"("province");

-- CreateIndex
CREATE INDEX "Answers_question_id_idx" ON "Answers"("question_id");

-- CreateIndex
CREATE INDEX "Banner_type_idx" ON "Banner"("type");

-- CreateIndex
CREATE INDEX "Banner_createdAt_idx" ON "Banner"("createdAt");

-- CreateIndex
CREATE INDEX "Childcategories_name_idx" ON "Childcategories"("name");

-- CreateIndex
CREATE INDEX "Childcategories_parentcategoriesId_idx" ON "Childcategories"("parentcategoriesId");

-- CreateIndex
CREATE INDEX "Childcategories_type_idx" ON "Childcategories"("type");

-- CreateIndex
CREATE INDEX "Containeritems_homecontainerId_idx" ON "Containeritems"("homecontainerId");

-- CreateIndex
CREATE INDEX "Containeritems_banner_id_idx" ON "Containeritems"("banner_id");

-- CreateIndex
CREATE INDEX "Containeritems_product_id_idx" ON "Containeritems"("product_id");

-- CreateIndex
CREATE INDEX "Homecontainer_idx_idx" ON "Homecontainer"("idx");

-- CreateIndex
CREATE INDEX "Homecontainer_type_idx" ON "Homecontainer"("type");

-- CreateIndex
CREATE INDEX "Info_product_id_idx" ON "Info"("product_id");

-- CreateIndex
CREATE INDEX "Info_info_type_idx" ON "Info"("info_type");

-- CreateIndex
CREATE INDEX "Notification_userid_idx" ON "Notification"("userid");

-- CreateIndex
CREATE INDEX "Notification_checked_idx" ON "Notification"("checked");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userid_checked_idx" ON "Notification"("userid", "checked");

-- CreateIndex
CREATE INDEX "Orderproduct_productId_idx" ON "Orderproduct"("productId");

-- CreateIndex
CREATE INDEX "Orderproduct_user_id_idx" ON "Orderproduct"("user_id");

-- CreateIndex
CREATE INDEX "Orderproduct_orderId_idx" ON "Orderproduct"("orderId");

-- CreateIndex
CREATE INDEX "Orderproduct_status_idx" ON "Orderproduct"("status");

-- CreateIndex
CREATE INDEX "Orderproduct_user_id_status_idx" ON "Orderproduct"("user_id", "status");

-- CreateIndex
CREATE INDEX "Orders_buyer_id_idx" ON "Orders"("buyer_id");

-- CreateIndex
CREATE INDEX "Orders_status_idx" ON "Orders"("status");

-- CreateIndex
CREATE INDEX "Orders_createdAt_idx" ON "Orders"("createdAt");

-- CreateIndex
CREATE INDEX "Orders_shipping_id_idx" ON "Orders"("shipping_id");

-- CreateIndex
CREATE INDEX "Paragraph_policyId_idx" ON "Paragraph"("policyId");

-- CreateIndex
CREATE INDEX "Parentcategories_name_idx" ON "Parentcategories"("name");

-- CreateIndex
CREATE INDEX "Parentcategories_type_idx" ON "Parentcategories"("type");

-- CreateIndex
CREATE INDEX "Parentcategories_pid_idx" ON "Parentcategories"("pid");

-- CreateIndex
CREATE INDEX "Policy_showtype_idx" ON "Policy"("showtype");

-- CreateIndex
CREATE INDEX "Productcategory_product_id_idx" ON "Productcategory"("product_id");

-- CreateIndex
CREATE INDEX "Productcategory_autocategory_id_idx" ON "Productcategory"("autocategory_id");

-- CreateIndex
CREATE UNIQUE INDEX "Productcategory_product_id_autocategory_id_key" ON "Productcategory"("product_id", "autocategory_id");

-- CreateIndex
CREATE INDEX "Productcover_productId_idx" ON "Productcover"("productId");

-- CreateIndex
CREATE INDEX "Productcover_type_idx" ON "Productcover"("type");

-- CreateIndex
CREATE INDEX "Products_name_idx" ON "Products"("name");

-- CreateIndex
CREATE INDEX "Products_parentcategory_id_idx" ON "Products"("parentcategory_id");

-- CreateIndex
CREATE INDEX "Products_childcategory_id_idx" ON "Products"("childcategory_id");

-- CreateIndex
CREATE INDEX "Products_promotion_id_idx" ON "Products"("promotion_id");

-- CreateIndex
CREATE INDEX "Products_userId_idx" ON "Products"("userId");

-- CreateIndex
CREATE INDEX "Products_relatedproductId_idx" ON "Products"("relatedproductId");

-- CreateIndex
CREATE INDEX "Products_price_idx" ON "Products"("price");

-- CreateIndex
CREATE INDEX "Products_amount_sold_idx" ON "Products"("amount_sold");

-- CreateIndex
CREATE INDEX "Products_createdAt_idx" ON "Products"("createdAt");

-- CreateIndex
CREATE INDEX "Products_updatedAt_idx" ON "Products"("updatedAt");

-- CreateIndex
CREATE INDEX "Promotion_expireAt_idx" ON "Promotion"("expireAt");

-- CreateIndex
CREATE INDEX "Promotion_createdAt_idx" ON "Promotion"("createdAt");

-- CreateIndex
CREATE INDEX "Questions_user_id_idx" ON "Questions"("user_id");

-- CreateIndex
CREATE INDEX "Questions_createdAt_idx" ON "Questions"("createdAt");

-- CreateIndex
CREATE INDEX "Stockvalue_stockId_idx" ON "Stockvalue"("stockId");

-- CreateIndex
CREATE INDEX "Stockvalue_qty_idx" ON "Stockvalue"("qty");

-- CreateIndex
CREATE INDEX "Tempimage_user_id_idx" ON "Tempimage"("user_id");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_oauthId_idx" ON "User"("oauthId");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Usersession_user_id_idx" ON "Usersession"("user_id");

-- CreateIndex
CREATE INDEX "Usersession_expireAt_idx" ON "Usersession"("expireAt");

-- CreateIndex
CREATE INDEX "Varianttemplate_variant_id_idx" ON "Varianttemplate"("variant_id");

-- CreateIndex
CREATE INDEX "Wishlist_uid_idx" ON "Wishlist"("uid");

-- CreateIndex
CREATE INDEX "Wishlist_pid_idx" ON "Wishlist"("pid");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_uid_pid_key" ON "Wishlist"("uid", "pid");

-- CreateIndex
CREATE INDEX "stock_product_id_idx" ON "stock"("product_id");

-- CreateIndex
CREATE INDEX "variant_product_id_idx" ON "variant"("product_id");

-- CreateIndex
CREATE INDEX "variant_sectionId_idx" ON "variant"("sectionId");

-- CreateIndex
CREATE INDEX "variant_option_type_idx" ON "variant"("option_type");

-- AddForeignKey
ALTER TABLE "variant" ADD CONSTRAINT "variant_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "variantsecion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variantsecion" ADD CONSTRAINT "variantsecion_productsId_fkey" FOREIGN KEY ("productsId") REFERENCES "Products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
