import { PrismaClient } from '@prisma/client'
import { createOrGetCustomer, createCheckoutSession, createPortalSession } from './index'

const prisma = new PrismaClient()

/**
 * 创建订阅结账会话
 */
export async function createBillingCheckout(params: {
  userId: string
  planId: string
  successUrl: string
  cancelUrl: string
}) {
  const { userId, planId, successUrl, cancelUrl } = params

  // 1. 获取用户信息（需要从 auth 获取 email）
  // 这里简化处理，实际应该从 token 中获取
  const userEmail = await getUserEmail(userId)

  // 2. 获取套餐定义
  const plan = await prisma.planDefinition.findUnique({
    where: { id: planId },
  })

  if (!plan) {
    throw new Error(`套餐不存在：${planId}`)
  }

  if (!plan.isActive) {
    throw new Error(`套餐已停用：${planId}`)
  }

  // 3. 创建或获取 Stripe Customer
  let billingCustomer = await prisma.billingCustomer.findUnique({
    where: { userId },
  })

  let stripeCustomerId = billingCustomer?.stripeCustomerId

  if (!stripeCustomerId) {
    stripeCustomerId = await createOrGetCustomer(userId, userEmail)

    // 创建本地计费客户记录
    billingCustomer = await prisma.billingCustomer.create({
      data: {
        userId,
        stripeCustomerId,
        stripeEmail: userEmail,
      },
    })
  }

  // 4. 创建 Checkout Session
  const session = await createCheckoutSession({
    customerId: stripeCustomerId,
    priceId: plan.stripePriceId,
    successUrl,
    cancelUrl,
  })

  if (!session.url) {
    throw new Error('无法创建结账会话')
  }

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  }
}

/**
 * 创建计费门户会话
 */
export async function createBillingPortal(params: {
  userId: string
  returnUrl: string
}) {
  const { userId, returnUrl } = params

  // 1. 获取计费客户
  const billingCustomer = await prisma.billingCustomer.findUnique({
    where: { userId },
  })

  if (!billingCustomer) {
    throw new Error('用户未创建计费账户')
  }

  // 2. 创建 Portal Session
  const session = await createPortalSession({
    customerId: billingCustomer.stripeCustomerId,
    returnUrl,
  })

  return {
    portalUrl: session.url,
  }
}

/**
 * 获取用户计费摘要
 */
export async function getBillingSummary(userId: string) {
  // 1. 获取计费客户
  const billingCustomer = await prisma.billingCustomer.findUnique({
    where: { userId },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        include: {
          plan: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!billingCustomer) {
    return null
  }

  const subscription = billingCustomer.subscriptions[0]

  if (!subscription) {
    return {
      hasSubscription: false,
      credits: {
        totalRemaining: 0,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      },
    }
  }

  // 2. 获取当前周期积分
  const now = new Date()
  const currentPeriod = await prisma.creditAllocationPeriod.findFirst({
    where: {
      billingCustomerId: billingCustomer.id,
      subscriptionId: subscription.id,
      periodStart: { lte: now },
      periodEnd: { gte: now },
    },
    orderBy: { periodStart: 'desc' },
  })

  // 3. 计算总剩余积分
  const allPeriods = await prisma.creditAllocationPeriod.findMany({
    where: {
      billingCustomerId: billingCustomer.id,
      remainingCredits: { gt: 0 },
    },
  })

  const totalRemaining = allPeriods.reduce(
    (sum, period) => sum + period.remainingCredits,
    0
  )

  return {
    hasSubscription: true,
    currentPlan: {
      name: subscription.plan.name,
      monthlyCredits: subscription.plan.monthlyCredits,
      priceCents: subscription.plan.priceCents,
    },
    credits: {
      totalRemaining,
      currentPeriodStart: currentPeriod?.periodStart || null,
      currentPeriodEnd: currentPeriod?.periodEnd || null,
      allocated: currentPeriod?.allocatedCredits || 0,
      consumed: currentPeriod?.consumedCredits || 0,
    },
    subscription: {
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    },
  }
}

/**
 * 获取积分账本
 */
export async function getCreditLedger(params: {
  userId: string
  limit?: number
  offset?: number
}) {
  const { userId, limit = 50, offset = 0 } = params

  const billingCustomer = await prisma.billingCustomer.findUnique({
    where: { userId },
  })

  if (!billingCustomer) {
    return { entries: [], total: 0 }
  }

  const [entries, total] = await Promise.all([
    prisma.creditLedger.findMany({
      where: { billingCustomerId: billingCustomer.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        subscription: {
          select: {
            plan: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.creditLedger.count({
      where: { billingCustomerId: billingCustomer.id },
    }),
  ])

  return {
    entries,
    total,
    hasMore: offset + entries.length < total,
  }
}

/**
 * 获取使用量记录
 */
export async function getUsageRecords(params: {
  userId: string
  featureType?: string
  limit?: number
}) {
  const { userId, featureType, limit = 50 } = params

  const billingCustomer = await prisma.billingCustomer.findUnique({
    where: { userId },
  })

  if (!billingCustomer) {
    return []
  }

  const where: any = {
    billingCustomerId: billingCustomer.id,
  }

  if (featureType) {
    where.featureType = featureType
  }

  return prisma.usageRecord.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * 消耗积分
 */
export async function consumeCredits(params: {
  userId: string
  featureType: string
  quantity: number
  creditsPerUnit: number
  metadata?: Record<string, any>
}) {
  const { userId, featureType, quantity, creditsPerUnit, metadata } = params
  const totalCredits = quantity * creditsPerUnit

  return prisma.$transaction(async (tx) => {
    // 1. 获取计费客户
    const billingCustomer = await tx.billingCustomer.findUnique({
      where: { userId },
    })

    if (!billingCustomer) {
      throw new Error('用户未创建计费账户')
    }

    // 2. 检查当前周期剩余积分
    const now = new Date()
    const currentPeriod = await tx.creditAllocationPeriod.findFirst({
      where: {
        billingCustomerId: billingCustomer.id,
        periodStart: { lte: now },
        periodEnd: { gte: now },
      },
      orderBy: { periodStart: 'desc' },
    })

    if (!currentPeriod) {
      throw new Error('当前无有效积分周期')
    }

    if (currentPeriod.remainingCredits < totalCredits) {
      throw new Error(
        `积分不足：需要${totalCredits}，剩余${currentPeriod.remainingCredits}`
      )
    }

    // 3. 更新周期记录
    await tx.creditAllocationPeriod.update({
      where: { id: currentPeriod.id },
      data: {
        consumedCredits: { increment: totalCredits },
        remainingCredits: { decrement: totalCredits },
      },
    })

    // 4. 计算新余额
    const previousLedger = await tx.creditLedger.findFirst({
      where: { billingCustomerId: billingCustomer.id },
      orderBy: { createdAt: 'desc' },
    })

    const previousBalance = previousLedger?.balanceAfter ?? 0
    const newBalance = previousBalance - totalCredits

    // 5. 创建积分账本记录
    await tx.creditLedger.create({
      data: {
        billingCustomerId: billingCustomer.id,
        amount: -totalCredits,
        balanceAfter: newBalance,
        type: 'API_CONSUMPTION',
        description: `${featureType} 使用 - ${quantity} 次`,
        metadata,
      },
    })

    // 6. 创建使用量记录
    await tx.usageRecord.create({
      data: {
        billingCustomerId: billingCustomer.id,
        featureType,
        quantity,
        creditsConsumed: totalCredits,
        metadata,
      },
    })

    return {
      success: true,
      consumed: totalCredits,
      balance: newBalance,
    }
  })
}

// Helper function - 实际应该从 auth 系统获取
async function getUserEmail(userId: string): Promise<string> {
  // TODO: 从 Supabase Auth 或数据库获取用户邮箱
  // 这里返回一个占位符
  return `user_${userId}@example.com`
}
