-- Add emailConfig column to Tenant table
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "emailConfig" JSONB;

-- Note: Tenant email configuration should be set via environment variables or admin UI
-- Do not store API keys in migration files for security reasons
