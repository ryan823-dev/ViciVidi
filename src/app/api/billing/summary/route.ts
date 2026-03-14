import { NextRequest, NextResponse } from 'next/server'
import { getBillingSummary, getCreditLedger } from '@/lib/stripe/billing'
import { auth } from '@/lib/auth'

/**
 * GET /api/billing/summary
 * 获取用户计费摘要
 */
export async function GET(req: NextRequest) {
  try {
    const user = await auth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const summary = await getBillingSummary(user.id)

    if (!summary) {
      return NextResponse.json({
        hasSubscription: false,
        message: 'No billing account found',
      })
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('Billing Summary Error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
