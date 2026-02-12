/*
  Warnings:

  - The primary key for the `Usersession` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `session_id` on the `Usersession` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Usersession` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[refresh_token_hash]` on the table `Usersession` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `device` to the `Usersession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refresh_token_hash` to the `Usersession` table without a default value. This is not possible if the table is not empty.
  - The required column `sessionid` was added to the `Usersession` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `userId` to the `Usersession` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Usersession" DROP CONSTRAINT "Usersession_user_id_fkey";

-- DropForeignKey
ALTER TABLE "stock" DROP CONSTRAINT "stock_product_id_fkey";

-- DropIndex
DROP INDEX "Usersession_user_id_idx";

-- AlterTable
ALTER TABLE "Usersession" DROP CONSTRAINT "Usersession_pkey",
DROP COLUMN "session_id",
DROP COLUMN "user_id",
ADD COLUMN     "device" TEXT NOT NULL,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "lastUsed" TIMESTAMP(3),
ADD COLUMN     "refresh_token_hash" TEXT NOT NULL,
ADD COLUMN     "revoked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sessionid" TEXT NOT NULL,
ADD COLUMN     "userAgent" TEXT,
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "Usersession_pkey" PRIMARY KEY ("sessionid");

-- CreateIndex
CREATE UNIQUE INDEX "Usersession_refresh_token_hash_key" ON "Usersession"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "Usersession_userId_idx" ON "Usersession"("userId");

-- CreateIndex
CREATE INDEX "Usersession_refresh_token_hash_idx" ON "Usersession"("refresh_token_hash");

-- AddForeignKey
ALTER TABLE "Usersession" ADD CONSTRAINT "Usersession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
