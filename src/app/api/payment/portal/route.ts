/**
 * 创建门户会话 API（管理订阅）
 * POST: 创建 Stripe 客户门户会话
 */

import { NextRequest, NextResponse } from 'next/server'
import { createPortalSession } from '@/lib/services/stripe'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { returnUrl } = body

    // 在开发模式下，返回模拟数据
    const isDev = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_mock'
    
    if (isDev) {
      return NextResponse.json({
        url: '#mock-portal',
        mock: true,
        message: '开发模式：门户会话已模拟',
      })
    }

    // 生产模式：创建真实的门户会话
    // TODO: 从认证中获取 userId
    const userId = 'user-id-from-auth'
    
    // 获取用户的 Stripe customer ID
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
      select: { stripeCustomerId: true },
    })

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: '未找到订阅信息' },
        { status: 404 }
      )
    }

    const session = await createPortalSession({
      customerId: subscription.stripeCustomerId,
      returnUrl: returnUrl || process.env.NEXT_PUBLIC_APP_URL || '',
    })

    return NextResponse.json({
      url: session.url,
    })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json(
      { error: '创建门户会话失败' },
      { status: 500 }
    )
  }
}
