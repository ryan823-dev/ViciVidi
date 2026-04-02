import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { SubscriptionStatus, CreditType } from '@prisma/client'

// ===== Auth: admin only =====
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, email: true },
  })
  if (userData?.role !== 'admin') return null
  return user
}

// ===== GET /api/admin/credits =====
// No userId: return all BillingCustomers overview
// With userId: return that customer's credit ledger (paginated)
export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const userId = searchParams.get('userId')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = 50

  if (!userId) {
    // Return overview of all billing customers
    const customers = await prisma.billingCustomer.findMany({
      include: {
        subscriptions: {
          where: {
            status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
          },
          include: { plan: { select: { name: true, monthlyCredits: true } } },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const overview = customers.map((c) => ({
      userId: c.userId,
      email: c.stripeEmail,
      stripeCustomerId: c.stripeCustomerId,
      planName: c.subscriptions[0]?.plan?.name ?? 'Free',
      monthlyCredits: c.subscriptions[0]?.plan?.monthlyCredits ?? 0,
      subscriptionStatus: c.subscriptions[0]?.status ?? 'none',
    }))

    return NextResponse.json({ overview })
  }

  // Return detailed ledger for a specific user
  const customer = await prisma.billingCustomer.findUnique({
    where: { userId },
    include: {
      subscriptions: {
        where: {
          status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
        },
        include: { plan: { select: { id: true, name: true, monthlyCredits: true } } },
        take: 1,
      },
    },
  })

  if (!customer) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const [ledger, total] = await Promise.all([
    prisma.creditLedger.findMany({
      where: { billingCustomerId: customer.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.creditLedger.count({ where: { billingCustomerId: customer.id } }),
  ])

  return NextResponse.json({
    user: {
      userId,
      email: customer.stripeEmail,
      stripeCustomerId: customer.stripeCustomerId,
      planName: customer.subscriptions[0]?.plan?.name ?? 'Free',
      monthlyCredits: customer.subscriptions[0]?.plan?.monthlyCredits ?? 0,
      subscriptionId: customer.subscriptions[0]?.id,
    },
    ledger,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  })
}

// ===== POST /api/admin/credits =====
// Manual credit adjustment: { userId, delta, reason }
// delta > 0 = grant, delta < 0 = deduct
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { userId, delta, reason } = body as { userId: string; delta: number; reason: string }

  if (!userId || delta === undefined || delta === 0) {
    return NextResponse.json({ error: 'userId and non-zero delta required' }, { status: 400 })
  }
  if (!reason?.trim()) {
    return NextResponse.json({ error: 'reason required' }, { status: 400 })
  }

  const customer = await prisma.billingCustomer.findUnique({
    where: { userId },
    include: {
      subscriptions: {
        where: {
          status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
        },
        take: 1,
      },
    },
  })

  if (!customer) {
    return NextResponse.json({ error: 'Billing customer not found' }, { status: 404 })
  }

  // Find current balance from most recent ledger entry
  const latestLedger = await prisma.creditLedger.findFirst({
    where: { billingCustomerId: customer.id },
    orderBy: { createdAt: 'desc' },
    select: { balanceAfter: true },
  })

  const currentBalance = latestLedger?.balanceAfter ?? 0
  const newBalance = Math.max(0, currentBalance + delta)
  const subscriptionId = customer.subscriptions[0]?.id

  // Write ledger entry (CreditLedger tracks audit trail; balance is derived from ledger)
  await prisma.creditLedger.create({
    data: {
      billingCustomerId: customer.id,
      subscriptionId: subscriptionId ?? null,
      amount: delta,
      balanceAfter: newBalance,
      type: CreditType.ADJUSTMENT,
      description: `[Admin adjustment] ${reason}`,
      metadata: { adminId: admin.id, reason },
    },
  })

  return NextResponse.json({
    success: true,
    previousBalance: currentBalance,
    newBalance,
    delta,
  })
}
