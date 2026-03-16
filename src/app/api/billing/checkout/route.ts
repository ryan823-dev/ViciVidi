import { NextRequest, NextResponse } from 'next/server'
import { createBillingCheckout } from '@/lib/stripe/billing'
import { auth } from '@/lib/auth'

/**
 * POST /api/billing/checkout
 * 创建订阅结账会话
 */
export async function POST(req: NextRequest) {
  try {
    // 1. 验证用户登录
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. 解析请求体
    const body = await req.json()
    const { planId } = body

    if (!planId) {
      return NextResponse.json(
        { error: 'Missing planId' },
        { status: 400 }
      )
    }

    // 3. 获取基础 URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    `https://${req.headers.get('host')}`

    // 4. 创建结账会话
    const { checkoutUrl, sessionId } = await createBillingCheckout({
      userId: session.user.id,
      planId,
      successUrl: `${baseUrl}/payment/success?session_id=${sessionId}`,
      cancelUrl: `${baseUrl}/payment/cancelled`,
    })

    return NextResponse.json({
      checkoutUrl,
      sessionId,
    })
  } catch (error) {
    console.error('Checkout API Error:', error)
    
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
