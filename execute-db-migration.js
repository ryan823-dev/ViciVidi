const { Client } = require('pg');

// 使用环境变量中的数据库连接信息
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:xZR9V0IR2uqYGQCe@db.vdzaqvmzzwtzuozozhzd.supabase.co:5432/postgres';

console.log('正在连接 Supabase 数据库...');
console.log('数据库 URL:', DATABASE_URL.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function executeMigration() {
  try {
    console.log('\n正在连接...');
    await client.connect();
    console.log('✓ 连接成功！\n');
    
    // 执行 SQL
    const sql = `
      -- 添加 role 字段（如果不存在）
      ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user';
      
      -- 设置管理员权限
      UPDATE "public"."users" SET role = 'admin' WHERE email = 'congrenmao799@gmail.com';
      
      -- 验证设置结果
      SELECT id, email, role, name, created_at FROM "public"."users" WHERE email = 'congrenmao799@gmail.com';
    `;
    
    console.log('执行 SQL 迁移...\n');
    
    const result = await client.query(sql);
    
    console.log('✅ SQL 执行成功！\n');
    console.log('验证结果:');
    console.log('─────────────────────────────────────');
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('用户 ID:', user.id);
      console.log('邮箱:', user.email);
      console.log('角色:', user.role);
      console.log('姓名:', user.name || '(未设置)');
      console.log('创建时间:', user.created_at);
      console.log('─────────────────────────────────────');
      
      if (user.role === 'admin') {
        console.log('\n✅ 管理员权限设置成功！');
        console.log('现在可以访问：https://vicividi.com/admin');
      } else {
        console.log('\n⚠️  警告：用户 role 字段不是 "admin"');
      }
    } else {
      console.log('⚠️  未找到用户 congrenmao799@gmail.com');
      console.log('提示：用户需要先登录 https://vicividi.com/login 创建账户');
    }
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    if (error.message.includes('relation "users" does not exist')) {
      console.log('\n提示：users 表可能不存在。请检查数据库 schema。');
    } else if (error.message.includes('getaddrinfo')) {
      console.log('\n提示：无法解析数据库主机名，可能是网络问题。');
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n数据库连接已关闭');
  }
}

executeMigration();
