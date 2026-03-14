import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始创建 ViciVidi AI 套餐定义...')

  // 创建三个套餐（订阅 + 数据包模式，面向中国外贸小团队）
  const plans = [
    {
      name: 'Starter',
      description: '适合外贸新手与个人 SOHO',
      monthlyCredits: 100,
      priceCents: 9900, // $99/月 或 ¥699/月
      billingInterval: 'month',
      features: {
        baseSearch: true,        // 基础线索搜索
        monthlyCredits: 100,     // 每月 100 credits
        basicFilters: true,      // 基础过滤
        exportCSV: true,         // 导出 CSV
        emailVerification: true, // 邮箱验证
        maxUsers: 1,
        support: 'email',
        dataSources: ['google', 'linkedin', 'facebook']
      }
    },
    {
      name: 'Growth',
      description: '适合成长型外贸团队（热门）',
      monthlyCredits: 300,
      priceCents: 17900, // $179/月 或 ¥1,299/月
      billingInterval: 'month',
      features: {
        baseSearch: true,
        monthlyCredits: 300,
        advancedSearch: true,    // 高级搜索
        aiAnalysis: true,        // AI 客户分析
        intentDetection: true,   // 购买意向检测
        customFilters: true,
        exportCSV: true,
        emailVerification: true,
        decisionMakerEmails: true, // 关键决策人邮箱
        maxUsers: 5,
        support: 'priority',
        dataSources: ['google', 'linkedin', 'facebook', 'instagram', 'companies_house']
      }
    },
    {
      name: 'Pro',
      description: '适合成熟外贸企业',
      monthlyCredits: 800,
      priceCents: 34900, // $349/月 或 ¥2,499/月
      billingInterval: 'month',
      features: {
        baseSearch: true,
        monthlyCredits: 800,
        advancedSearch: true,
        aiAnalysis: true,
        intentDetection: true,
        customFilters: true,
        exportCSV: true,
        emailVerification: true,
        decisionMakerEmails: true,
        apiAccess: true,         // API 访问
        crmIntegration: true,    // CRM 集成
        customIntegrations: true, // 定制集成
        dedicatedSupport: true,  // 专属支持
        maxUsers: -1,            // 无限用户
        support: 'dedicated',
        dataSources: ['google', 'linkedin', 'facebook', 'instagram', 'companies_house', 'qcc', 'tyc']
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
  console.log('\n📦 接下来创建数据包（Credit Packs）定义...\n')

  // 创建数据包产品（一次性购买，无订阅）
  const creditPacks = [
    {
      name: 'Small Pack',
      description: '轻度使用者首选',
      credits: 100,
      priceCents: 9900, // $99
      unitPrice: 0.99,  // $0.99/credit
      validity: 12,     // 12 个月有效期
      features: {
        popular: false,
        bestValue: false
      }
    },
    {
      name: 'Medium Pack',
      description: '最受欢迎（省 38%）',
      credits: 400,
      priceCents: 24900, // $249
      unitPrice: 0.62,   // $0.62/credit
      validity: 12,
      features: {
        popular: true,
        bestValue: false
      }
    },
    {
      name: 'Large Pack',
      description: '性价比之王（省 67%）',
      credits: 1500,
      priceCents: 49900, // $499
      unitPrice: 0.33,   // $0.33/credit
      validity: 12,
      features: {
        popular: false,
        bestValue: true
      }
    },
    {
      name: 'Enterprise Pack',
      description: '企业首选（省 80%）',
      credits: 5000,
      priceCents: 99900, // $999
      unitPrice: 0.20,   // $0.20/credit
      validity: 24,      // 24 个月有效期
      features: {
        popular: false,
        bestValue: false
      }
    }
  ]

  for (const pack of creditPacks) {
    const product = await prisma.planDefinition.upsert({
      where: {
        id: `pack_${pack.name.toLowerCase().replace(' ', '_')}`
      },
      update: {
        monthlyCredits: pack.credits,
        priceCents: pack.priceCents,
        features: {
          ...pack.features,
          unitPrice: pack.unitPrice,
          validity: pack.validity,
          type: 'credit_pack'
        }
      },
      create: {
        id: `pack_${pack.name.toLowerCase().replace(' ', '_')}`,
        name: pack.name,
        description: pack.description,
        monthlyCredits: pack.credits,
        priceCents: pack.priceCents,
        currency: 'usd',
        billingInterval: 'one_time', // 一次性购买
        isActive: true,
        features: {
          ...pack.features,
          unitPrice: pack.unitPrice,
          validity: pack.validity,
          type: 'credit_pack'
        },
        stripeProductId: `prod_pack_${pack.name.toLowerCase().replace(' ', '_')}_placeholder`,
        stripePriceId: `price_pack_${pack.name.toLowerCase().replace(' ', '_')}_placeholder`
      }
    })

    console.log(`✅ 创建数据包：${pack.name} (${pack.credits} credits - $${pack.priceCents / 100}, $${pack.unitPrice}/credit)`)
  }

  console.log('\n✨ 所有产品定义创建完成！')
  console.log('\n⚠️  重要提示：')
  console.log('1. 在 Stripe Dashboard 创建对应的 Products 和 Prices')
  console.log('2. 订阅套餐：选择"Recurring billing"（月付/年付）')
  console.log('3. 数据包：选择"One-time payment"（一次性）')
  console.log('4. 更新 plan_definitions 表中的 stripeProductId 和 stripePriceId')
  console.log('5. 或者运行：npx prisma studio 手动更新这些字段')
  console.log('\n💡 建议配置：')
  console.log('- 订阅套餐：提供月付和年付两个 Price（年付享受 17% 折扣）')
  console.log('- 数据包：仅一次性支付，有效期 12-24 个月')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
