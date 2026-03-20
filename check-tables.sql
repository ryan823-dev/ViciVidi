-- 检查所有可用的 schema
SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;

-- 检查所有表（包括所有 schema）
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_type = 'BASE TABLE' 
ORDER BY table_schema, table_name;

-- 检查 Supabase auth schema 中的用户
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;
