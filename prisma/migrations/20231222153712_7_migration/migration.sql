/*
  Warnings:

  - Added the required column `expireAt` to the `Promotion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Promotion" ADD COLUMN     "expireAt" TIMESTAMP(3) NOT NULL;
