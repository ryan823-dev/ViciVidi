import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getBillingSummary } from '@/lib/stripe/billing'

/**
 * GET /api/credits/balance
 * Returns the current user's credit balance for sidebar display.
 * Lightweight — only returns what the sidebar needs.
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const summary = await getBillingSummary(session.user.id)

    if (!summary || !summary.hasSubscription) {
      return NextResponse.json({
        balance: FREE_TRIAL_CREDITS_FALLBACK,
        plan: 'Free Trial',
        hasSubscription: false,
      })
    }

    return NextResponse.json({
      balance: summary.credits.totalRemaining,
      plan: summary.currentPlan?.name ?? 'Unknown',
      hasSubscription: true,
      periodEnd: summary.credits.currentPeriodEnd,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const FREE_TRIAL_CREDITS_FALLBACK = 0
