/**
 * 套餐切换 API
 * POST: 切换用户套餐（升级/降级）
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getStripe } from '@/lib/services/stripe'
import { Plan } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { newPlan, changeType } = body

    // 验证参数
    if (!newPlan || !['PRO', 'BUSINESS', 'ENTERPRISE', 'STARTER'].includes(newPlan)) {
      return NextResponse.json(
        { error: '无效的套餐类型' },
        { status: 400 }
      )
    }

    if (!changeType || !['immediate', 'end_of_period'].includes(changeType)) {
      return NextResponse.json(
        { error: '无效的切换类型' },
        { status: 400 }
      )
    }

    // 在开发模式下，直接切换
    const isDev = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_mock'
    
    if (isDev) {
      // 模拟套餐切换
      return NextResponse.json({
        success: true,
        mock: true,
        message: `开发模式：套餐已切换为 ${newPlan}，${changeType === 'immediate' ? '立即生效' : '周期结束后生效'}`,
        newPlan,
        changeType,
      })
    }

    // 生产模式：通过 Stripe 处理
    // TODO: 从认证中获取 userId
    const userId = 'user-id-from-auth'
    
    // 获取用户当前订阅
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
    })

    if (!subscription) {
      // 没有订阅，创建新的
      return NextResponse.json(
        { error: '未找到订阅信息，请先订阅' },
        { status: 404 }
      )
    }

    const stripe = getStripe()

    if (changeType === 'immediate') {
      // 立即切换（补差价/退款）
      const subscriptionUpdate = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId!,
        {
          items: [{
            id: subscription.stripeSubscriptionId!,
            price: getPriceIdForPlan(newPlan as Plan, subscription.interval!),
          }],
          proration_behavior: 'create_prorations', // 按比例计费
        }
      )

      // 更新数据库
      await prisma.userSubscription.update({
        where: { userId },
        data: {
          plan: newPlan as Plan,
          status: subscriptionUpdate.status,
        },
      })

      await prisma.userQuota.update({
        where: { userId },
        data: {
          plan: newPlan as Plan,
        },
      })

      return NextResponse.json({
        success: true,
        newPlan,
        changeType: 'immediate',
        message: '套餐已立即生效，费用将在下次账单中调整',
      })
    } else {
      // 周期结束后切换
      await prisma.userSubscription.update({
        where: { userId },
        data: {
          plan: newPlan as Plan,
          cancelAtPeriodEnd: true, // 标记在当前周期结束时切换
        },
      })

      return NextResponse.json({
        success: true,
        newPlan,
        changeType: 'end_of_period',
        message: `套餐将在当前计费周期结束后切换为 ${newPlan}`,
        periodEnd: subscription.currentPeriodEnd,
      })
    }
  } catch (error) {
    console.error('Error changing plan:', error)
    return NextResponse.json(
      { error: '套餐切换失败', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * 根据套餐和周期获取价格 ID
 */
function getPriceIdForPlan(plan: Plan, interval: string): string {
  const PRICE_MAP: Record<Plan, { monthly: string; yearly: string }> = {
    STARTER: {
      monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
      yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || '',
    },
    PRO: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
    },
    BUSINESS: {
      monthly: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || 'price_business_monthly',
      yearly: process.env.STRIPE_PRICE_BUSINESS_YEARLY || 'price_business_yearly',
    },
    ENTERPRISE: {
      monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
      yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_enterprise_yearly',
    },
  }

  return PRICE_MAP[plan][interval as 'monthly' | 'yearly']
}
