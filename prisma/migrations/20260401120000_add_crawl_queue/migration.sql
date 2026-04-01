-- CreateTable
CREATE TABLE "crawl_queue" (
    "id" TEXT NOT NULL DEFAULT ('crawlq_' || gen_random_uuid()::text),
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "root_url" TEXT NOT NULL,
    "folder_id" TEXT,
    "total_pages" INTEGER NOT NULL,
    "processed_pages" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "urls" JSONB NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crawl_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crawl_queue_batch_id_key" ON "crawl_queue"("batch_id");

-- CreateIndex
CREATE INDEX "crawl_queue_tenant_id_idx" ON "crawl_queue"("tenant_id");

-- CreateIndex
CREATE INDEX "crawl_queue_status_idx" ON "crawl_queue"("status");

-- CreateIndex
CREATE INDEX "crawl_queue_tenant_status_idx" ON "crawl_queue"("tenant_id", "status");

-- AddForeignKey
ALTER TABLE "crawl_queue" 
    ADD CONSTRAINT "crawl_queue_tenant_id_fkey" 
    FOREIGN KEY ("tenant_id") 
    REFERENCES "tenant"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;
