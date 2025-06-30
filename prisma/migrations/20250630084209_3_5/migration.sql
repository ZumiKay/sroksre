-- DropIndex
DROP INDEX "Orders_id_status_createdAt_idx";

-- AlterTable
ALTER TABLE "Orders" ADD COLUMN     "sessionId" TEXT;

-- CreateIndex
CREATE INDEX "Orders_id_status_createdAt_sessionId_idx" ON "Orders"("id", "status", "createdAt", "sessionId");
