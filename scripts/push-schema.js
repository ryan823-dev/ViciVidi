/**
 * 创建数据库表结构
 */

const { Client } = require('pg')

async function createTables() {
  const client = new Client({
    connectionString: 'postgresql://postgres.bsptzrgehllgoghlkeqq:xdqzgQ5gx3L5SeB@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres',
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('🔗 连接数据库...')
    await client.connect()
    console.log('✅ 数据库连接成功')

    // 创建 plan_definitions 表
    console.log('📝 创建 plan_definitions 表...')

    await client.query(`
      CREATE TABLE IF NOT EXISTS plan_definitions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        stripe_product_id TEXT UNIQUE,
        stripe_price_id TEXT UNIQUE,
        monthly_credits INTEGER DEFAULT 0,
        price_cents INTEGER DEFAULT 0,
        currency TEXT DEFAULT 'usd',
        billing_interval TEXT DEFAULT 'month',
        is_active BOOLEAN DEFAULT true,
        features JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `)

    console.log('✅ 表创建成功')

  } catch (error) {
    console.error('❌ 错误:', error.message)
  } finally {
    await client.end()
  }
}

createTables()