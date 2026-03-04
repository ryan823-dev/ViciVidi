-- Content Publishing Pipeline: Vertax → 客户官网推送
-- 扩展 WebsiteConfig + 新建 PushRecord

-- === PushStatus Enum ===
CREATE TYPE "PushStatus" AS ENUM ('PENDING', 'CONFIRMED', 'TIMEOUT', 'FAILED', 'ESCALATED');

-- === Extend WebsiteConfig ===
ALTER TABLE "WebsiteConfig" ADD COLUMN IF NOT EXISTS "siteType" TEXT NOT NULL DEFAULT 'supabase';
ALTER TABLE "WebsiteConfig" ADD COLUMN IF NOT EXISTS "supabaseUrl" TEXT;
ALTER TABLE "WebsiteConfig" ADD COLUMN IF NOT EXISTS "functionName" TEXT;
ALTER TABLE "WebsiteConfig" ADD COLUMN IF NOT EXISTS "pushSecret" TEXT;
ALTER TABLE "WebsiteConfig" ADD COLUMN IF NOT EXISTS "fieldMapping" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "WebsiteConfig" ADD COLUMN IF NOT EXISTS "approvalTimeoutHours" INTEGER NOT NULL DEFAULT 24;
ALTER TABLE "WebsiteConfig" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- === PushRecord Table ===
CREATE TABLE "PushRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "websiteConfigId" TEXT NOT NULL,
    "status" "PushStatus" NOT NULL DEFAULT 'PENDING',
    "remoteId" TEXT,
    "remoteSlug" TEXT,
    "targetUrl" TEXT,
    "pushPayload" JSONB,
    "pushedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeoutAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushRecord_pkey" PRIMARY KEY ("id")
);

-- === Indexes ===
CREATE INDEX "PushRecord_tenantId_status_idx" ON "PushRecord"("tenantId", "status");
CREATE INDEX "PushRecord_contentId_idx" ON "PushRecord"("contentId");
CREATE INDEX "PushRecord_websiteConfigId_idx" ON "PushRecord"("websiteConfigId");
CREATE INDEX "PushRecord_status_timeoutAt_idx" ON "PushRecord"("status", "timeoutAt");

-- === Unique: one push record per content per site ===
CREATE UNIQUE INDEX "PushRecord_contentId_websiteConfigId_key" ON "PushRecord"("contentId", "websiteConfigId");

-- === Foreign Keys ===
ALTER TABLE "PushRecord" ADD CONSTRAINT "PushRecord_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "SeoContent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PushRecord" ADD CONSTRAINT "PushRecord_websiteConfigId_fkey" FOREIGN KEY ("websiteConfigId") REFERENCES "WebsiteConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
