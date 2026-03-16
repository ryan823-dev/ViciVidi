import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始创建 ViciVidi AI 套餐定义...')

  // 创建三个套餐（订阅 + 按效果付费模式，面向中国外贸小团队）
  const plans = [
    {
      name: 'Starter',
      description: '适合外贸新手与个人 SOHO',
      monthlyCredits: 50,
      priceCents: 3900, // $39/月（创始会员价¥299）
      billingInterval: 'month',
      features: {
        baseSearch: true,        // 基础线索搜索
        monthlyCredits: 50,      // 每月 50 credits（用于按效果付费）
        aiAnalysisQuota: 10,     // 10 次 AI 客户评分
        basicFilters: true,
        exportCSV: true,
        emailVerification: true, // 邮箱验证（按效果付费）
        maxUsers: 1,
        support: 'email',
        dataSources: ['google', 'linkedin', 'facebook']
      }
    },
    {
      name: 'Growth',
      description: '适合成长型外贸团队（热门）',
      monthlyCredits: 100,
      priceCents: 7900, // $79/月（创始会员价¥599）
      billingInterval: 'month',
      features: {
        baseSearch: true,
        monthlyCredits: 100,
        aiAnalysisQuota: 50,     // 50 次 AI 客户评分
        advancedSearch: true,    // 高级搜索
        aiLeadScoring: true,     // AI 线索评分
        intentDetection: true,   // 购买意向检测
        customFilters: true,
        exportCSV: true,
        emailVerification: true,
        decisionMakerEmails: true, // 关键决策人邮箱（按效果付费）
        maxUsers: 5,
        support: 'priority',
        dataSources: ['google', 'linkedin', 'facebook', 'instagram', 'companies_house']
      }
    },
    {
      name: 'Pro',
      description: '适合成熟外贸企业',
      monthlyCredits: 300,
      priceCents: 13900, // $139/月（创始会员价¥999）
      billingInterval: 'month',
      features: {
        baseSearch: true,
        monthlyCredits: 300,
        aiAnalysisQuota: 200,    // 200 次 AI 客户评分
        advancedSearch: true,
        aiLeadScoring: true,
        intentDetection: true,
        customFilters: true,
        exportCSV: true,
        emailVerification: true,
        decisionMakerEmails: true,
        aiReportGeneration: true, // AI 深度报告（按效果付费）
        aiEmailGeneration: true,  // AI 开发信生成（按效果付费）
        apiAccess: true,
        crmIntegration: true,
        customIntegrations: true,
        dedicatedSupport: true,
        maxUsers: -1,
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
  console.log('\n📦 接下来创建预充值套餐（Credits）定义...\n')

  // 创建预充值套餐（用于按效果付费）
  const creditPacks = [
    {
      name: 'Small Credits',
      description: '入门体验',
      credits: 500,
      priceCents: 4900, // $49
      unitPrice: 0.098,  // $0.098/credit
      validity: 12,     // 12 个月有效期
      features: {
        popular: false,
        bestValue: false,
        bonus: 0
      }
    },
    {
      name: 'Medium Credits',
      description: '最受欢迎（送 100 credits）',
      credits: 1200,
      priceCents: 9900, // $99
      unitPrice: 0.082,   // $0.082/credit
      validity: 12,
      features: {
        popular: true,
        bestValue: false,
        bonus: 100
      }
    },
    {
      name: 'Large Credits',
      description: '超值特惠（送 300 credits）',
      credits: 3000,
      priceCents: 19900, // $199
      unitPrice: 0.066,   // $0.066/credit
      validity: 18,
      features: {
        popular: false,
        bestValue: true,
        bonus: 300
      }
    },
    {
      name: 'Enterprise Credits',
      description: '企业专享（送 2000 credits）',
      credits: 10000,
      priceCents: 49900, // $499
      unitPrice: 0.05,   // $0.05/credit
      validity: 24,      // 24 个月有效期
      features: {
        popular: false,
        bestValue: false,
        bonus: 2000
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

    console.log(`✅ 创建预充值套餐：${pack.name} (${pack.credits} credits - $${pack.priceCents / 100}, $${pack.unitPrice}/credit)`)
  }

  console.log('\n✨ 所有产品定义创建完成！')
  console.log('\n💡 收费模式说明：')
  console.log('1. 订阅套餐：提供基础线索 + 每月 AI 分析额度')
  console.log('2. 预充值套餐：用于按效果付费服务（邮箱验证、AI 报告等）')
  console.log('3. 按效果付费：')
  console.log('   - 邮箱验证：$0.10/个（成功才收费）')
  console.log('   - 决策人邮箱：$0.50/个（成功才收费）')
  console.log('   - AI 客户评分：$1/次')
  console.log('   - AI 深度报告：$9.9/份')
  console.log('   - AI 开发信：$2/封')
  console.log('\n⚠️  重要提示：')
  console.log('1. 在 Stripe Dashboard 创建对应的 Products 和 Prices')
  console.log('2. 订阅套餐：选择"Recurring billing"（月付/年付）')
  console.log('3. 预充值套餐：选择"One-time payment"（一次性）')
  console.log('4. 更新 plan_definitions 表中的 stripeProductId 和 stripePriceId')
  console.log('5. 或者运行：npx prisma studio 手动更新这些字段')
  console.log('\n💰 创始会员优惠（前 10 个客户）：')
  console.log('- Starter: $19.5/月（5 折）')
  console.log('- Growth: $39.5/月（5 折）')
  console.log('- Pro: $69.5/月（5 折）')
  console.log('- 每月赠送 50 credits（价值$5）')
  console.log('- 免费使用 AI 开发信（限 3 封/月）')
}

main()
  .catch((e) => {
    console.error('❌ 种子数据创建失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
