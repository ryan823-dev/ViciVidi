import { PrismaClient } from '@prisma/client'
import { createOrGetCustomer, createCheckoutSession, createPortalSession } from './index'
import { getPlanById, getPackById } from '@/lib/credits/config'

const prisma = new PrismaClient()

/**
 * Create a Stripe Checkout session for a subscription plan or credit pack.
 * Looks up Price IDs from config (no PlanDefinition table needed).
 */
export async function createBillingCheckout(params: {
  userId: string
  planId: string      // plan_starter | plan_growth | plan_pro | pack_500 | pack_1200 | ...
  successUrl: string
  cancelUrl: string
}) {
  const { userId, planId, successUrl, cancelUrl } = params

  // Resolve Price ID from config — no DB lookup needed
  const plan = getPlanById(planId)
  const pack = getPackById(planId)
  const priceId = plan?.stripePriceId ?? pack?.stripePriceId

  if (!priceId) {
    throw new Error(`Unknown plan/pack ID: ${planId}`)
  }

  const userEmail = await getUserEmail(userId)

  // Get or create Stripe Customer
  let billingCustomer = await prisma.billingCustomer.findUnique({
    where: { userId },
  })

  let stripeCustomerId = billingCustomer?.stripeCustomerId

  if (!stripeCustomerId) {
    stripeCustomerId = await createOrGetCustomer(userId, userEmail)
    billingCustomer = await prisma.billingCustomer.create({
      data: {
        userId,
        stripeCustomerId,
        stripeEmail: userEmail,
      },
    })
  }

  const session = await createCheckoutSession({
    customerId: stripeCustomerId,
    priceId,
    successUrl,
    cancelUrl,
  })

  if (!session.url) {
    throw new Error('Failed to create Stripe Checkout session')
  }

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  }
}

/**
 * Create a Stripe Billing Portal session so users can manage their subscription.
 */
export async function createBillingPortal(params: {
  userId: string
  returnUrl: string
}) {
  const { userId, returnUrl } = params

  const billingCustomer = await prisma.billingCustomer.findUnique({
    where: { userId },
  })

  if (!billingCustomer) {
    throw new Error('No billing account found for this user')
  }

  const session = await createPortalSession({
    customerId: billingCustomer.stripeCustomerId,
    returnUrl,
  })

  return { portalUrl: session.url }
}

/**
 * Get billing summary for the sidebar credit widget and billing page.
 */
export async function getBillingSummary(userId: string) {
  const billingCustomer = await prisma.billingCustomer.findUnique({
    where: { userId },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        include: { plan: true },
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
        allocated: 0,
        consumed: 0,
      },
    }
  }

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

  const allPeriods = await prisma.creditAllocationPeriod.findMany({
    where: {
      billingCustomerId: billingCustomer.id,
      remainingCredits: { gt: 0 },
    },
  })

  const totalRemaining = allPeriods.reduce((sum, p) => sum + p.remainingCredits, 0)

  return {
    hasSubscription: true,
    currentPlan: {
      name: subscription.plan.name,
      monthlyCredits: subscription.plan.monthlyCredits,
      priceCents: subscription.plan.priceCents,
    },
    credits: {
      totalRemaining,
      currentPeriodStart: currentPeriod?.periodStart ?? null,
      currentPeriodEnd: currentPeriod?.periodEnd ?? null,
      allocated: currentPeriod?.allocatedCredits ?? 0,
      consumed: currentPeriod?.consumedCredits ?? 0,
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
 * Get credit ledger entries for the billing page history.
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
    }),
    prisma.creditLedger.count({
      where: { billingCustomerId: billingCustomer.id },
    }),
  ])

  return { entries, total, hasMore: offset + entries.length < total }
}

/**
 * Deduct credits for a feature usage. Enforces balance check atomically.
 */
export async function consumeCredits(params: {
  userId: string
  featureType: string
  quantity: number
  creditsPerUnit: number
  metadata?: Record<string, string | number | boolean | null>
}) {
  const { userId, featureType, quantity, creditsPerUnit, metadata } = params
  const totalCredits = quantity * creditsPerUnit

  return prisma.$transaction(async (tx) => {
    const billingCustomer = await tx.billingCustomer.findUnique({ where: { userId } })
    if (!billingCustomer) throw new Error('No billing account found')

    const now = new Date()
    const currentPeriod = await tx.creditAllocationPeriod.findFirst({
      where: {
        billingCustomerId: billingCustomer.id,
        periodStart: { lte: now },
        periodEnd: { gte: now },
      },
      orderBy: { periodStart: 'desc' },
    })

    if (!currentPeriod) throw new Error('No active credit period')
    if (currentPeriod.remainingCredits < totalCredits) {
      throw new Error(`Insufficient credits: need ${totalCredits}, have ${currentPeriod.remainingCredits}`)
    }

    await tx.creditAllocationPeriod.update({
      where: { id: currentPeriod.id },
      data: {
        consumedCredits: { increment: totalCredits },
        remainingCredits: { decrement: totalCredits },
      },
    })

    const previousLedger = await tx.creditLedger.findFirst({
      where: { billingCustomerId: billingCustomer.id },
      orderBy: { createdAt: 'desc' },
    })

    const newBalance = (previousLedger?.balanceAfter ?? 0) - totalCredits

    await tx.creditLedger.create({
      data: {
        billingCustomerId: billingCustomer.id,
        amount: -totalCredits,
        balanceAfter: newBalance,
        type: 'API_CONSUMPTION',
        description: `${featureType} x${quantity}`,
        metadata,
      },
    })

    await tx.usageRecord.create({
      data: {
        billingCustomerId: billingCustomer.id,
        featureType,
        quantity,
        creditsConsumed: totalCredits,
        metadata,
      },
    })

    return { success: true, consumed: totalCredits, balance: newBalance }
  })
}

async function getUserEmail(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  })
  return user?.email ?? `user_${userId}@vicividi.com`
}
