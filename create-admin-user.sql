-- =============================================
-- 创建管理员账号脚本
-- =============================================
-- 执行方式：
-- 1. 访问 https://app.supabase.com
-- 2. 选择您的新项目
-- 3. 进入 SQL Editor 页面
-- 4. 复制本文件内容并执行
-- =============================================

-- 步骤 1: 创建用户账号（使用 Supabase Auth）
-- 注意：如果提示用户已存在，说明账号已经创建
SELECT auth.uid() as current_user_id;

-- 步骤 2: 使用 Supabase 管理后台创建用户（推荐方式）
-- 请访问：Authentication -> Users -> Add user
-- 手动创建用户：
--   Email: congrenmao799@gmail.com
--   Password: moore1982
--   Auto Confirm User: ✓ (勾选)

-- 步骤 3: 或者使用 SQL 创建（需要确认权限）
-- 注意：某些 Supabase 项目可能不允许直接插入 auth.users
-- 如果下面的 SQL 执行失败，请手动在管理后台创建

-- 创建用户并设置密码
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- 尝试创建用户
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    creation_method,
    created_at,
    updated_at
  )
  SELECT
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'congrenmao799@gmail.com',
    crypt('moore1982', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Admin User"}',
    'signup',
    NOW(),
    NOW()
  RETURNING id INTO new_user_id;
  
  RAISE NOTICE '用户创建成功，ID: %', new_user_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '创建失败：% - 请手动在管理后台创建用户', SQLERRM;
END $$;

-- 步骤 4: 创建 public.users 表
CREATE TABLE IF NOT EXISTS "public"."users" (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 步骤 5: 同步所有用户到 public.users
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
ON CONFLICT (id) DO NOTHING;

-- 步骤 6: 验证用户
SELECT 
  id, 
  email, 
  role, 
  name, 
  created_at 
FROM "public"."users" 
ORDER BY created_at DESC;

-- =============================================
-- 执行完成后，使用以下账号登录：
-- Email: congrenmao799@gmail.com
-- Password: moore1982
-- =============================================
