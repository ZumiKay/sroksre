-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'EDITOR');

-- CreateEnum
CREATE TYPE "Imagetemptype" AS ENUM ('COVER', 'BANNER');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "type" TEXT,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "phonenumber" TEXT,
    "password" TEXT NOT NULL,
    "whislist" JSONB,
    "vfy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wishlist" (
    "id" SERIAL NOT NULL,
    "pid" INTEGER NOT NULL,
    "uid" INTEGER NOT NULL,

    CONSTRAINT "Wishlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" SERIAL NOT NULL,
    "street" TEXT,
    "houseId" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "songkhat" TEXT NOT NULL,
    "postalcode" TEXT NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usersession" (
    "session_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expireAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usersession_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "Parentcategories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Parentcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Childcategories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "parentcategoriesId" INTEGER,

    CONSTRAINT "Childcategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Products" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "description" TEXT NOT NULL DEFAULT '',
    "stocktype" TEXT NOT NULL DEFAULT 'stock',
    "stock" INTEGER,
    "parentcategory_id" INTEGER NOT NULL,
    "childcategory_id" INTEGER,
    "order_id" TEXT,
    "review_id" INTEGER,
    "amount_sold" INTEGER DEFAULT 0,
    "amount_incart" INTEGER DEFAULT 0,
    "amount_wishlist" INTEGER DEFAULT 0,
    "promotion_id" INTEGER,
    "discount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "relatedproductId" INTEGER,
    "userId" INTEGER,

    CONSTRAINT "Products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Productcover" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isSaved" BOOLEAN DEFAULT true,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "Productcover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tempimage" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "Tempimage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producttype" (
    "id" SERIAL NOT NULL,
    "productId" JSONB NOT NULL,

    CONSTRAINT "Producttype_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orders" (
    "id" TEXT NOT NULL,
    "buyer_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "estimate" TIMESTAMP(3),
    "price" JSONB NOT NULL,
    "shippingtype" TEXT NOT NULL DEFAULT 'Normal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "shipping_id" INTEGER,

    CONSTRAINT "Orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Orderproduct" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'incart',
    "quantity" INTEGER NOT NULL,
    "details" JSONB NOT NULL,
    "orderId" TEXT,

    CONSTRAINT "Orderproduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" TEXT NOT NULL DEFAULT 'large',
    "linktype" TEXT,
    "image" JSONB NOT NULL,
    "parentcate_id" INTEGER,
    "childcate_id" INTEGER,
    "selectedproduct_id" JSONB,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Homecontainer" (
    "id" SERIAL NOT NULL,
    "idx" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "scrollabletype" TEXT,
    "amountofitem" INTEGER,
    "daterange" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updateAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Homecontainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Containeritems" (
    "id" SERIAL NOT NULL,
    "homecontainerId" INTEGER,
    "banner_id" INTEGER,
    "product_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Containeritems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "banner_id" INTEGER,
    "expireAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answers" (
    "id" SERIAL NOT NULL,
    "answer" TEXT NOT NULL,
    "question_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Questions" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Info" (
    "id" SERIAL NOT NULL,
    "info_title" TEXT NOT NULL,
    "info_value" JSONB NOT NULL,
    "info_type" TEXT NOT NULL,
    "product_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER,
    "option_title" TEXT NOT NULL,
    "option_type" TEXT NOT NULL,
    "option_value" TEXT[],

    CONSTRAINT "variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "variant_val" TEXT[],

    CONSTRAINT "stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paragraph" (
    "id" SERIAL NOT NULL,
    "policyId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Paragraph_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "checked" BOOLEAN DEFAULT false,
    "link" TEXT,
    "userid" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phonenumber_key" ON "User"("phonenumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_password_key" ON "User"("password");

-- CreateIndex
CREATE UNIQUE INDEX "variant_option_title_option_value_key" ON "variant"("option_title", "option_value");

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_uid_fkey" FOREIGN KEY ("uid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_pid_fkey" FOREIGN KEY ("pid") REFERENCES "Products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usersession" ADD CONSTRAINT "Usersession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Childcategories" ADD CONSTRAINT "Childcategories_parentcategoriesId_fkey" FOREIGN KEY ("parentcategoriesId") REFERENCES "Parentcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_parentcategory_id_fkey" FOREIGN KEY ("parentcategory_id") REFERENCES "Parentcategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_childcategory_id_fkey" FOREIGN KEY ("childcategory_id") REFERENCES "Childcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_relatedproductId_fkey" FOREIGN KEY ("relatedproductId") REFERENCES "Producttype"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Productcover" ADD CONSTRAINT "Productcover_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tempimage" ADD CONSTRAINT "Tempimage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_shipping_id_fkey" FOREIGN KEY ("shipping_id") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orders" ADD CONSTRAINT "Orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orderproduct" ADD CONSTRAINT "Orderproduct_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orderproduct" ADD CONSTRAINT "Orderproduct_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Orderproduct" ADD CONSTRAINT "Orderproduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Containeritems" ADD CONSTRAINT "Containeritems_banner_id_fkey" FOREIGN KEY ("banner_id") REFERENCES "Banner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Containeritems" ADD CONSTRAINT "Containeritems_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Containeritems" ADD CONSTRAINT "Containeritems_homecontainerId_fkey" FOREIGN KEY ("homecontainerId") REFERENCES "Homecontainer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_banner_id_fkey" FOREIGN KEY ("banner_id") REFERENCES "Banner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answers" ADD CONSTRAINT "Answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Questions" ADD CONSTRAINT "Questions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Info" ADD CONSTRAINT "Info_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant" ADD CONSTRAINT "variant_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paragraph" ADD CONSTRAINT "Paragraph_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userid_fkey" FOREIGN KEY ("userid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
