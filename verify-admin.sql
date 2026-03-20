-- 验证管理员账号设置
SELECT id, email, role, created_at 
FROM "users" 
WHERE email = 'congrenmao799@gmail.com'
ORDER BY created_at DESC 
LIMIT 1;

-- 查看所有用户的角色
SELECT email, role FROM "users" ORDER BY created_at DESC;
