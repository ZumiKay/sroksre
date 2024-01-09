-- AlterTable
ALTER TABLE "Productcover" ALTER COLUMN "isSaved" DROP NOT NULL,
ALTER COLUMN "isSaved" SET DEFAULT true;
