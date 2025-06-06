-- AlterTable
CREATE SEQUENCE homecontainer_idx_seq;
ALTER TABLE "Homecontainer" ALTER COLUMN "idx" DROP NOT NULL,
ALTER COLUMN "idx" SET DEFAULT nextval('homecontainer_idx_seq');
ALTER SEQUENCE homecontainer_idx_seq OWNED BY "Homecontainer"."idx";
