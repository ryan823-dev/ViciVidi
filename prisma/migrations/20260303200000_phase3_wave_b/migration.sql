-- Phase 3 Wave B: Collaboration Shell + Radar Module

-- ===================== ArtifactComment: anchor fields =====================
ALTER TABLE "ArtifactComment" ADD COLUMN IF NOT EXISTS "anchorType" TEXT;
ALTER TABLE "ArtifactComment" ADD COLUMN IF NOT EXISTS "anchorValue" TEXT;
ALTER TABLE "ArtifactComment" ADD COLUMN IF NOT EXISTS "anchorLabel" TEXT;

-- ===================== ArtifactTask: source comment link =====================
ALTER TABLE "ArtifactTask" ADD COLUMN IF NOT EXISTS "sourceCommentId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "ArtifactTask_sourceCommentId_key" ON "ArtifactTask"("sourceCommentId");
DO $$ BEGIN
  ALTER TABLE "ArtifactTask" ADD CONSTRAINT "ArtifactTask_sourceCommentId_fkey" FOREIGN KEY ("sourceCommentId") REFERENCES "ArtifactComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===================== Radar Enums =====================
DO $$ BEGIN CREATE TYPE "ChannelType" AS ENUM ('TENDER', 'MAPS', 'DIRECTORY', 'TRADESHOW', 'HIRING', 'ECOSYSTEM', 'CUSTOM'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "AdapterType" AS ENUM ('API', 'RSS', 'AI_SEARCH', 'CSV_IMPORT', 'MANUAL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "RadarStoragePolicy" AS ENUM ('ID_ONLY', 'TTL_CACHE', 'SNAPSHOT_IMPORT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "CandidateType" AS ENUM ('COMPANY', 'OPPORTUNITY', 'CONTACT'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "CandidateStatus" AS ENUM ('NEW', 'REVIEWING', 'QUALIFIED', 'IMPORTED', 'EXCLUDED', 'EXPIRED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "RadarTaskStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "OpportunityStage" AS ENUM ('IDENTIFIED', 'QUALIFYING', 'PURSUING', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===================== RadarSource =====================
CREATE TABLE IF NOT EXISTS "RadarSource" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "channelType" "ChannelType" NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "countries" TEXT[],
    "regions" TEXT[],
    "adapterType" "AdapterType" NOT NULL,
    "adapterConfig" JSONB NOT NULL DEFAULT '{}',
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "requiresAuth" BOOLEAN NOT NULL DEFAULT false,
    "termsUrl" TEXT,
    "storagePolicy" "RadarStoragePolicy" NOT NULL DEFAULT 'TTL_CACHE',
    "ttlDays" INTEGER NOT NULL DEFAULT 90,
    "attributionRequired" BOOLEAN NOT NULL DEFAULT true,
    "rateLimit" JSONB NOT NULL DEFAULT '{}',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "syncStats" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RadarSource_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "RadarSource_code_key" ON "RadarSource"("code");
CREATE INDEX IF NOT EXISTS "RadarSource_channelType_isEnabled_idx" ON "RadarSource"("channelType", "isEnabled");

-- ===================== RadarTask =====================
CREATE TABLE IF NOT EXISTS "RadarTask" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT,
    "sourceId" TEXT NOT NULL,
    "targetingRef" JSONB,
    "channelMapRef" TEXT,
    "queryConfig" JSONB NOT NULL,
    "status" "RadarTaskStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelToken" TEXT,
    "stats" JSONB,
    "errorMessage" TEXT,
    "triggeredBy" TEXT NOT NULL,
    "scheduleRule" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RadarTask_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "RadarTask_tenantId_status_idx" ON "RadarTask"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "RadarTask_sourceId_status_idx" ON "RadarTask"("sourceId", "status");
DO $$ BEGIN
  ALTER TABLE "RadarTask" ADD CONSTRAINT "RadarTask_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "RadarSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===================== RadarCandidate =====================
CREATE TABLE IF NOT EXISTS "RadarCandidate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "taskId" TEXT,
    "candidateType" "CandidateType" NOT NULL,
    "externalId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "country" TEXT,
    "city" TEXT,
    "industry" TEXT,
    "companySize" TEXT,
    "deadline" TIMESTAMP(3),
    "estimatedValue" DOUBLE PRECISION,
    "currency" TEXT,
    "buyerName" TEXT,
    "buyerCountry" TEXT,
    "buyerType" TEXT,
    "categoryCode" TEXT,
    "categoryName" TEXT,
    "contactRole" TEXT,
    "linkedCandidateId" TEXT,
    "matchScore" DOUBLE PRECISION,
    "matchExplain" JSONB,
    "aiSummary" TEXT,
    "aiRelevance" JSONB,
    "status" "CandidateStatus" NOT NULL DEFAULT 'NEW',
    "qualifyTier" TEXT,
    "qualifyReason" TEXT,
    "qualifiedAt" TIMESTAMP(3),
    "qualifiedBy" TEXT,
    "importedToType" TEXT,
    "importedToId" TEXT,
    "importedAt" TIMESTAMP(3),
    "importedBy" TEXT,
    "rawData" JSONB,
    "expireAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RadarCandidate_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "RadarCandidate_sourceId_externalId_key" ON "RadarCandidate"("sourceId", "externalId");
CREATE INDEX IF NOT EXISTS "RadarCandidate_tenantId_candidateType_status_idx" ON "RadarCandidate"("tenantId", "candidateType", "status");
CREATE INDEX IF NOT EXISTS "RadarCandidate_tenantId_qualifyTier_idx" ON "RadarCandidate"("tenantId", "qualifyTier");
CREATE INDEX IF NOT EXISTS "RadarCandidate_tenantId_sourceId_idx" ON "RadarCandidate"("tenantId", "sourceId");
CREATE INDEX IF NOT EXISTS "RadarCandidate_taskId_idx" ON "RadarCandidate"("taskId");
CREATE INDEX IF NOT EXISTS "RadarCandidate_expireAt_idx" ON "RadarCandidate"("expireAt");
DO $$ BEGIN
  ALTER TABLE "RadarCandidate" ADD CONSTRAINT "RadarCandidate_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "RadarSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "RadarCandidate" ADD CONSTRAINT "RadarCandidate_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "RadarTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===================== ProspectCompany =====================
CREATE TABLE IF NOT EXISTS "ProspectCompany" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "country" TEXT,
    "city" TEXT,
    "industry" TEXT,
    "companySize" TEXT,
    "description" TEXT,
    "tier" TEXT,
    "tags" TEXT[],
    "sourceType" TEXT,
    "sourceCandidateId" TEXT,
    "sourceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "assignedTo" TEXT,
    "lastContactedAt" TIMESTAMP(3),
    "nextActionDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "ProspectCompany_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ProspectCompany_tenantId_status_idx" ON "ProspectCompany"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "ProspectCompany_tenantId_tier_idx" ON "ProspectCompany"("tenantId", "tier");
CREATE INDEX IF NOT EXISTS "ProspectCompany_tenantId_industry_idx" ON "ProspectCompany"("tenantId", "industry");
CREATE INDEX IF NOT EXISTS "ProspectCompany_assignedTo_idx" ON "ProspectCompany"("assignedTo");

-- ===================== ProspectContact =====================
CREATE TABLE IF NOT EXISTS "ProspectContact" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT,
    "department" TEXT,
    "seniority" TEXT,
    "linkedInUrl" TEXT,
    "sourceCandidateId" TEXT,
    "sourceUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "ProspectContact_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ProspectContact_tenantId_companyId_idx" ON "ProspectContact"("tenantId", "companyId");
CREATE INDEX IF NOT EXISTS "ProspectContact_tenantId_status_idx" ON "ProspectContact"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "ProspectContact_email_idx" ON "ProspectContact"("email");
DO $$ BEGIN
  ALTER TABLE "ProspectContact" ADD CONSTRAINT "ProspectContact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "ProspectCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===================== Opportunity =====================
CREATE TABLE IF NOT EXISTS "Opportunity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceCandidateId" TEXT,
    "sourceUrl" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "deadline" TIMESTAMP(3),
    "estimatedValue" DOUBLE PRECISION,
    "currency" TEXT,
    "categoryCode" TEXT,
    "categoryName" TEXT,
    "stage" "OpportunityStage" NOT NULL DEFAULT 'IDENTIFIED',
    "probability" INTEGER,
    "lostReason" TEXT,
    "wonAt" TIMESTAMP(3),
    "lostAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    "nextAction" TEXT,
    "nextActionDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Opportunity_tenantId_stage_idx" ON "Opportunity"("tenantId", "stage");
CREATE INDEX IF NOT EXISTS "Opportunity_tenantId_deadline_idx" ON "Opportunity"("tenantId", "deadline");
CREATE INDEX IF NOT EXISTS "Opportunity_companyId_idx" ON "Opportunity"("companyId");
CREATE INDEX IF NOT EXISTS "Opportunity_assignedTo_idx" ON "Opportunity"("assignedTo");
DO $$ BEGIN
  ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "ProspectCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===================== RadarSearchProfile =====================
CREATE TABLE IF NOT EXISTS "RadarSearchProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "segmentId" TEXT,
    "personaId" TEXT,
    "keywords" JSONB NOT NULL DEFAULT '{}',
    "negativeKeywords" JSONB,
    "targetCountries" TEXT[],
    "targetRegions" TEXT[],
    "industryCodes" TEXT[],
    "categoryFilters" TEXT[],
    "enabledChannels" "ChannelType"[],
    "sourceIds" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scheduleRule" TEXT NOT NULL DEFAULT '0 6 * * *',
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RadarSearchProfile_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "RadarSearchProfile_tenantId_isActive_idx" ON "RadarSearchProfile"("tenantId", "isActive");
