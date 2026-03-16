/**
 * 使用 pg 库执行 SQL 脚本
 */

const { Client } = require('pg')
const fs = require('fs')

async function executeSQL() {
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

    const sql = fs.readFileSync('./update-stripe-products.sql', 'utf8')
    console.log('📝 执行 SQL 脚本...')

    await client.query(sql)
    console.log('✅ SQL 执行成功')

    // 验证结果
    const result = await client.query('SELECT id, name, monthly_credits, stripe_product_id FROM plan_definitions ORDER BY price_cents')
    console.log('\n📊 插入的记录:')
    result.rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.monthly_credits} credits (${row.id})`)
    })

  } catch (error) {
    console.error('❌ 错误:', error.message)
  } finally {
    await client.end()
  }
}

executeSQL()