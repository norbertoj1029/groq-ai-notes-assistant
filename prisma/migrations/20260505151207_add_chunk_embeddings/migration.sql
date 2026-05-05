-- AlterTable
ALTER TABLE "DocumentChunk" ADD COLUMN "embedding" TEXT;
ALTER TABLE "DocumentChunk" ADD COLUMN "embeddingModel" TEXT;

-- CreateIndex
CREATE INDEX "DocumentChunk_embeddingModel_idx" ON "DocumentChunk"("embeddingModel");
