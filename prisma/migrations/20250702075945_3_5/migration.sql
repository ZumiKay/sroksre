-- DropIndex
DROP INDEX "Orders_id_status_createdAt_sessionId_idx";

-- AlterTable
ALTER TABLE "Orders" ADD COLUMN     "achieve" BOOLEAN;

-- CreateIndex
CREATE INDEX "Orders_id_status_createdAt_sessionId_achieve_idx" ON "Orders"("id", "status", "createdAt", "sessionId", "achieve");
