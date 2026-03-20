-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");

-- Comment: 管理员设置说明
-- 1. 找到管理员用户的 ID: SELECT id, email FROM users WHERE email = 'admin@vicividi.com';
-- 2. 设置为管理员：UPDATE users SET role = 'admin' WHERE email = 'admin@vicividi.com';
