/**
 * 重置用户密码
 */

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    const email = 'admin@tdpaint.com';
    const newPassword = 'Tdpaint2026!';
    
    console.log(`🔄 正在重置用户 ${email} 的密码...`);
    
    // 生成新的密码哈希
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log(`🔐 新密码哈希：${hashedPassword}`);
    
    // 更新数据库
    const result = await client.query(
      'UPDATE "User" SET password = $1 WHERE email = $2',
      [hashedPassword, email]
    );
    
    if (result.rowCount === 0) {
      console.log('❌ 用户不存在');
    } else {
      console.log('✅ 密码已重置成功！');
      console.log(`   新密码：${newPassword}`);
    }
    
    // 验证更新
    const userResult = await client.query(
      'SELECT id, email, password FROM "User" WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length > 0) {
      const isValid = await bcrypt.compare(newPassword, userResult.rows[0].password);
      console.log(`\n🔍 验证结果：${isValid ? '✅ 密码匹配' : '❌ 密码不匹配'}`);
    }
    
  } catch (error: any) {
    console.error('❌ 错误:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
