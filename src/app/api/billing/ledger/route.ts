import { NextRequest, NextResponse } from 'next/server'
import { getCreditLedger } from '@/lib/stripe/billing'
import { auth } from '@/lib/auth'

/**
 * GET /api/billing/ledger
 * 获取积分账本
 */
export async function GET(req: NextRequest) {
  try {
    const user = await auth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const ledger = await getCreditLedger({
      userId: user.id,
      limit,
      offset,
    })

    return NextResponse.json(ledger)
  } catch (error) {
    console.error('Credit Ledger Error:', error)
    
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
