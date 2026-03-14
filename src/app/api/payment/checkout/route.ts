/**
 * 创建结账会话 API
 * POST: 创建 Stripe 结账会话
 */

import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/services/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { plan, interval } = body

    // 验证参数
    if (!plan || !['PRO', 'BUSINESS', 'ENTERPRISE'].includes(plan)) {
      return NextResponse.json(
        { error: '无效的套餐类型' },
        { status: 400 }
      )
    }

    if (!interval || !['monthly', 'yearly'].includes(interval)) {
      return NextResponse.json(
        { error: '无效的计费周期' },
        { status: 400 }
      )
    }

    // 在开发模式下，返回模拟会话
    const isDev = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_mock'
    
    if (isDev) {
      // 模拟成功
      return NextResponse.json({
        sessionId: 'mock_session_' + Date.now(),
        url: '#mock-checkout-success',
        mock: true,
        message: '开发模式：支付已成功模拟',
      })
    }

    // 生产模式：创建真实的 Stripe 会话
    // TODO: 从认证中获取 userId
    const userId = 'user-id-from-auth'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || ''

    const session = await createCheckoutSession({
      userId,
      plan: plan as 'PRO' | 'BUSINESS' | 'ENTERPRISE',
      interval: interval as 'monthly' | 'yearly',
      successUrl: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/payment/cancelled`,
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: '创建支付会话失败' },
      { status: 500 }
    )
  }
}
