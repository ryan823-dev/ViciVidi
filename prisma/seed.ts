import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始创建 ViciVidi AI 套餐定义...')

  // 创建三个套餐
  const plans = [
    {
      name: 'Starter',
      description: '适合小型团队和初创公司',
      monthlyCredits: 100,
      priceCents: 9900, // $99
      billingInterval: 'month',
      features: {
        aiSearch: true,
        intentDetection: true,
        webhookExport: true,
        emailVerification: 100,
        companyEnrichment: 100,
        maxUsers: 3,
        support: 'email'
      }
    },
    {
      name: 'Scale',
      description: '适合成长型中型企业',
      monthlyCredits: 500,
      priceCents: 29900, // $299
      billingInterval: 'month',
      features: {
        aiSearch: true,
        intentDetection: true,
        webhookExport: true,
        emailVerification: 500,
        companyEnrichment: 500,
        maxUsers: 10,
        support: 'priority',
        advancedAnalytics: true,
        crmIntegration: true
      }
    },
    {
      name: 'Pro',
      description: '适合大型企业和高 volume 使用',
      monthlyCredits: 2000,
      priceCents: 99900, // $999
      billingInterval: 'month',
      features: {
        aiSearch: true,
        intentDetection: true,
        webhookExport: true,
        emailVerification: 2000,
        companyEnrichment: 2000,
        maxUsers: -1, // 无限
        support: 'dedicated',
        advancedAnalytics: true,
        crmIntegration: true,
        customIntegrations: true,
        sla: true,
        dedicatedAccountManager: true
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
