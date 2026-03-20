-- =============================================
-- ViciVidi 运营后台 - 管理员权限设置脚本
-- =============================================
-- 执行方式：
-- 1. 访问 https://app.supabase.com
-- 2. 选择项目：vdzaqvmzzwtzuozozhzd
-- 3. 进入 SQL Editor 页面
-- 4. 复制本文件内容并执行
-- =============================================

-- 步骤 1: 检查 auth.users 中是否有该用户
SELECT 
  id, 
  email, 
  created_at,
  raw_user_meta_data->>'name' as name
FROM auth.users 
WHERE email = 'congrenmao799@gmail.com';

-- 步骤 2: 创建 public.users 表（如果不存在）
CREATE TABLE IF NOT EXISTS "public"."users" (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 步骤 3: 从 auth.users 同步所有用户数据到 public.users
INSERT INTO "public"."users" (id, email, name, role, created_at)
SELECT 
  id,
  email,
  raw_user_meta_data->>'name' as name,
  'user' as role,
  created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 步骤 4: 设置管理员权限
UPDATE "public"."users" 
SET role = 'admin' 
WHERE email = 'congrenmao799@gmail.com';

-- 步骤 5: 验证设置结果
SELECT 
  id, 
  email, 
  role, 
  name, 
  created_at 
FROM "public"."users" 
WHERE email = 'congrenmao799@gmail.com';

-- =============================================
-- 执行完成后，如果看到 role = 'admin'，说明成功！
-- 然后可以访问：https://vicividi.com/admin
-- =============================================
