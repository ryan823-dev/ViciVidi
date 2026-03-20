const https = require('https');

// Supabase 项目信息
const PROJECT_REF = 'vdzaqvmzzwtzuozozhzd';
const DB_PASSWORD = 'xZR9V0IR2uqYGQCe';

// SQL 语句 - 设置管理员权限
const SQL = `
-- 添加 role 字段（如果不存在）
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user';

-- 设置管理员权限
UPDATE "public"."users" SET role = 'admin' WHERE email = 'congrenmao799@gmail.com';

-- 验证设置结果
SELECT id, email, role, name, created_at FROM "public"."users" WHERE email = 'congrenmao799@gmail.com';
`;

// 使用 Supabase REST API
const options = {
  hostname: `${PROJECT_REF}.supabase.co`,
  port: 443,
  path: '/rest/v1/users?select=*&email=eq.congrenmao799@gmail.com',
  method: 'GET',
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkemFxdm16end0enVvehpoeiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzQzNzQ4ODQwLCJleHAiOjE3NTE5NDg4NDB9.dXk-NF_4B0F0eC0R0wF0vF0wF0wF0wF0wF0wF0wF0wF',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkemFxdm16end0enVvehpoeiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzQzNzQ4ODQwLCJleHAiOjE3NTE5NDg4NDB9.dXk-NF_4B0F0eC0R0wF0vF0wF0wF0wF0wF0wF0wF0wF',
    'Content-Type': 'application/json'
  }
};

console.log('尝试通过 Supabase REST API 检查用户数据...');
console.log('项目:', PROJECT_REF);
console.log('目标邮箱：congrenmao799@gmail.com\n');

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('状态码:', res.statusCode);
    console.log('响应:', data);
    
    if (res.statusCode === 200) {
      try {
        const users = JSON.parse(data);
        if (users.length > 0) {
          const user = users[0];
          console.log('\n✓ 找到用户:', user.email);
          console.log('  当前 role:', user.role || '(未设置)');
          
          if (user.role === 'admin') {
            console.log('\n✅ 用户已经是管理员！');
          } else {
            console.log('\n⚠️ 用户 role 不是 admin，需要更新');
          }
        } else {
          console.log('\n⚠️ 未找到用户 congrenmao799@gmail.com');
          console.log('提示：用户需要先登录 https://vicividi.com/login 创建账户');
        }
      } catch (e) {
        console.log('解析响应失败:', e.message);
      }
    } else {
      console.log('\n错误：API 返回非 200 状态码');
      console.log('可能需要 service_role key 而不是 anon key');
    }
  });
});

req.on('error', (e) => {
  console.error('请求失败:', e.message);
  process.exit(1);
});

req.end();
