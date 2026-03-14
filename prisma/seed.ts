import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始创建 ViciVidi AI 套餐定义...')

  // 创建四个套餐（对标 Revor 定价策略）
  const plans = [
    {
      name: 'Free',
      description: '个人试用与体验',
      monthlyCredits: 300,
      priceCents: 0, // $0
      billingInterval: 'month',
      features: {
        databaseLeads: 100,      // 数据库线索 100 条
        newLeads: 50,            // 新发现线索 50 条
        maxListSize: 25,         // 单个列表 25 条
        basicFilters: true,      // 基础过滤
        exportCSV: true,         // 导出 CSV
        emailVerification: false,
        decisionMakerEmails: false,
        maxUsers: 1,
        support: 'community'
      }
    },
    {
      name: 'Starter',
      description: '适合个人销售与小型团队',
      monthlyCredits: 5000,
      priceCents: 4900, // $49
      billingInterval: 'month',
      features: {
        databaseLeads: 1000,     // 数据库线索 1000 条
        newLeads: 800,           // 新发现线索 800 条
        maxListSize: 500,        // 单个列表 500 条
        basicFilters: true,
        exportCSV: true,
        emailVerification: true, // 邮箱验证
        decisionMakerEmails: true, // 关键决策人邮箱
        maxUsers: 3,
        support: 'email'
      }
    },
    {
      name: 'Scale',
      description: '适合快速成长的团队',
      monthlyCredits: 12000,
      priceCents: 9900, // $99 (热门套餐)
      billingInterval: 'month',
      features: {
        databaseLeads: 12000,    // 数据库线索 12,000 条
        newLeads: 2000,          // 新发现线索 2,000 条
        maxListSize: -1,         // 无限列表大小
        customFilters: true,     // 自定义过滤
        exportCSV: true,
        emailVerification: true,
        decisionMakerEmails: true,
        advancedAnalytics: true, // 高级分析
        crmIntegration: true,    // CRM 集成
        maxUsers: 10,
        support: 'priority'
      }
    },
    {
      name: 'Pro',
      description: '适合大型团队与企业',
      monthlyCredits: 30000,
      priceCents: 19900, // $199
      billingInterval: 'month',
      features: {
        databaseLeads: 50000,    // 数据库线索 50,000 条
        newLeads: 5000,          // 新发现线索 5,000 条
        maxListSize: -1,
        customFilters: true,
        exportCSV: true,
        emailVerification: true,
        decisionMakerEmails: true,
        advancedAnalytics: true,
        crmIntegration: true,
        apiAccess: true,         // API 访问
        customIntegrations: true, // 定制集成
        dedicatedSupport: true,  // 专属支持
        maxUsers: -1,            // 无限用户
        support: 'dedicated'
      }
    }
  ]

  for (const planData of plans) {
    // 注意：这些 stripeProductId 和 stripePriceId 需要在 Stripe Dashboard 创建后更新
    // 这里使用占位符，实际部署时需要替换为真实的 ID
    const plan = await prisma.planDefinition.upsert({
      where: {
        id: `plan_${planData.name.toLowerCase()}`
      },
      update: {
        monthlyCredits: planData.monthlyCredits,
        priceCents: planData.priceCents,
        features: planData.features
      },
      create: {
        id: `plan_${planData.name.toLowerCase()}`,
        name: planData.name,
        description: planData.description,
        monthlyCredits: planData.monthlyCredits,
        priceCents: planData.priceCents,
        currency: 'usd',
        billingInterval: planData.billingInterval,
        isActive: true,
        features: planData.features,
        stripeProductId: `prod_${planData.name.toLowerCase()}_placeholder`,
        stripePriceId: `price_${planData.name.toLowerCase()}_placeholder`
      }
    })

    console.log(`✅ 创建套餐：${plan.name} (${plan.monthlyCredits} credits - $${plan.priceCents / 100})`)
  }

  console.log('\n✨ 套餐定义创建完成！')
  console.log('\n⚠️  重要提示：')
  console.log('1. 在 Stripe Dashboard 创建对应的 Products 和 Prices')
  console.log('2. 更新 plan_definitions 表中的 stripeProductId 和 stripePriceId')
  console.log('3. 或者运行：npx prisma studio 手动更新这些字段')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
