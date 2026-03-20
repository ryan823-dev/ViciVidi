-- =============================================
-- 设置管理员权限
-- =============================================

-- 步骤 1: 创建 public.users 表（如果不存在）
CREATE TABLE IF NOT EXISTS "public"."users" (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 步骤 2: 同步 auth.users 到 public.users
INSERT INTO "public"."users" (id, email, name, role, created_at)
SELECT 
  id,
  email,
  raw_user_meta_data->>'name' as name,
  CASE 
    WHEN email = 'congrenmao799@gmail.com' THEN 'admin'
    ELSE 'user'
  END as role,
  created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = CASE 
    WHEN EXCLUDED.email = 'congrenmao799@gmail.com' THEN 'admin'
    ELSE COALESCE("public"."users".role, 'user')
  END,
  updated_at = NOW();

-- 步骤 3: 验证设置结果
SELECT 
  id, 
  email, 
  role, 
  name, 
  created_at 
FROM "public"."users" 
ORDER BY created_at DESC;

-- =============================================
-- 如果看到 role = 'admin'，说明设置成功！
-- 现在可以登录：https://vicividi.com/login
-- 账号：congrenmao799@gmail.com
-- 密码：moore1982
-- =============================================
