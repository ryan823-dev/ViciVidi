-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'REVIEWING', 'QUALIFIED', 'IMPORTED', 'EXCLUDED', 'ENRICHING', 'CONTACTED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "LeadTier" AS ENUM ('A', 'B', 'C', 'EXCLUDED');

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "domain" TEXT,
    "contact_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "country" TEXT,
    "city" TEXT,
    "address" TEXT,
    "industry" TEXT,
    "company_size" TEXT,
    "description" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "tier" "LeadTier",
    "source_id" TEXT,
    "source_url" TEXT,
    "external_id" TEXT,
    "task_id" TEXT,
    "match_score" DOUBLE PRECISION,
    "match_explain" JSONB,
    "qualify_reason" TEXT,
    "qualified_at" TIMESTAMP(3),
    "qualified_by" TEXT,
    "enriching" BOOLEAN NOT NULL DEFAULT false,
    "enriched_at" TIMESTAMP(3),
    "research_data" JSONB,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assigned_to" TEXT,
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_contacted_at" TIMESTAMP(3),
    "next_action_date" TIMESTAMP(3),
    "next_action" TEXT,
    "imported_at" TIMESTAMP(3),
    "converted_at" TIMESTAMP(3),
    "lost_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- AddField to email_verifications
ALTER TABLE "email_verifications" ADD COLUMN "lead_id" TEXT;

-- CreateIndex
CREATE INDEX "leads_workspace_id_idx" ON "leads"("workspace_id");
CREATE INDEX "leads_status_idx" ON "leads"("status");
CREATE INDEX "leads_tier_idx" ON "leads"("tier");
CREATE INDEX "leads_source_id_idx" ON "leads"("source_id");
CREATE INDEX "leads_match_score_idx" ON "leads"("match_score");
CREATE INDEX "leads_deleted_at_idx" ON "leads"("deleted_at");
CREATE INDEX "leads_created_at_idx" ON "leads"("created_at");
CREATE INDEX "email_verifications_lead_id_idx" ON "email_verifications"("lead_id");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE;
