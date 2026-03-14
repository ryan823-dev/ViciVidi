/**
 * 验证支付会话 API
 * POST: 验证 Stripe 结账会话状态
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getStripe } from '@/lib/services/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: '缺少会话 ID' },
        { status: 400 }
      )
    }

    // 在开发模式下，直接返回成功
    const isDev = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_mock'
    
    if (isDev) {
      return NextResponse.json({
        success: true,
        mock: true,
        message: '开发模式：支付已验证',
      })
    }

    // 生产模式：从 Stripe 验证会话
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status !== 'paid') {
      return NextResponse.json({
        success: false,
        message: '支付尚未完成',
      })
    }

    // 获取订阅信息
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      )

      // 更新用户订阅状态
      const { userId, plan } = session.metadata || {}
      
      if (userId && plan) {
        const sub: any = subscription
        await prisma.userSubscription.upsert({
          where: { userId },
          update: {
            stripeSubscriptionId: subscription.id,
            plan: plan as any,
            status: subscription.status,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
          create: {
            userId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscription.id,
            plan: plan as any,
            status: subscription.status,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        })

        // 更新用户配额
        const now = new Date()
        await prisma.userQuota.upsert({
          where: { userId },
          update: {
            plan: plan as any,
          },
          create: {
            userId,
            plan: plan as any,
            periodEnd: new Date(now.setMonth(now.getMonth() + 1)),
            userSubscriptionId: subscription.id,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      subscription: {
        status: session.metadata?.plan,
        interval: session.metadata?.interval,
      },
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: '验证支付失败', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
