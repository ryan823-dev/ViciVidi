/**
 * 增值购买 API
 * POST: 购买增值服务包
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getStripe } from '@/lib/services/stripe'

// 增值服务包配置
const ADDON_PACKAGES = {
  EMAIL_VERIFICATION: {
    50: { priceId: 'price_addon_email_50', price: 50 },
    200: { priceId: 'price_addon_email_200', price: 180 },
    500: { priceId: 'price_addon_email_500', price: 400 },
  },
  COMPANY: {
    1000: { priceId: 'price_addon_company_1000', price: 100 },
    5000: { priceId: 'price_addon_company_5000', price: 450 },
    10000: { priceId: 'price_addon_company_10000', price: 800 },
  },
  EXPORT: {
    50: { priceId: 'price_addon_export_50', price: 30 },
    200: { priceId: 'price_addon_export_200', price: 100 },
    500: { priceId: 'price_addon_export_500', price: 220 },
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resource, amount } = body

    // 验证参数
    if (!resource || !['EMAIL_VERIFICATION', 'COMPANY', 'EXPORT'].includes(resource)) {
      return NextResponse.json(
        { error: '无效的增值类型' },
        { status: 400 }
      )
    }

    const resourceData = ADDON_PACKAGES[resource as keyof typeof ADDON_PACKAGES]
    const amountKey = amount as keyof typeof resourceData
    
    if (!resourceData[amountKey]) {
      return NextResponse.json(
        { error: '无效的数量' },
        { status: 400 }
      )
    }

    const packageInfo = resourceData[amountKey] as { priceId: string; price: number }

    // 在开发模式下，直接添加配额
    const isDev = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_mock'
    
    if (isDev) {
      // 模拟增值购买
      return NextResponse.json({
        success: true,
        mock: true,
        message: `开发模式：已成功购买 ${amount} 个${getResourceName(resource)}，配额已添加到账户`,
        resource,
        amount,
        price: packageInfo.price,
      })
    }

    // 生产模式：创建 Stripe 结账会话
    // TODO: 从认证中获取 userId
    const userId = 'user-id-from-auth'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || ''

    const stripe = getStripe()
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'alipay'],
      line_items: [
        {
          price: packageInfo.priceId,
          quantity: 1,
        },
      ],
      mode: 'payment', // 一次性购买
      success_url: `${baseUrl}/addons/success?session_id={CHECKOUT_SESSION_ID}&resource=${resource}&amount=${amount}`,
      cancel_url: `${baseUrl}/addons/cancelled`,
      metadata: {
        userId,
        resource,
        amount: amount.toString(),
        type: 'addon',
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Error purchasing addon:', error)
    return NextResponse.json(
      { error: '购买失败', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * 验证增值购买并添加配额
 */
export async function verifyAddonPurchase(params: {
  sessionId: string
  resource: string
  amount: number
}) {
  const { sessionId, resource, amount } = params
  
  const stripe = getStripe()
  const session = await stripe.checkout.sessions.retrieve(sessionId)

  if (session.payment_status !== 'paid') {
    throw new Error('支付尚未完成')
  }

  // TODO: 从认证中获取 userId
  const userId = session.metadata?.userId || 'user-id-from-auth'

  // 添加配额到用户账户
  if (resource === 'EMAIL_VERIFICATION') {
    await prisma.userQuota.update({
      where: { userId },
      data: {
        extraEmailVerifications: {
          increment: amount,
        },
      },
    })
  }
  // 可以添加其他资源类型的处理

  return { success: true }
}

function getResourceName(resource: string): string {
  const names: Record<string, string> = {
    EMAIL_VERIFICATION: '邮箱验证次数',
    COMPANY: '公司配额',
    EXPORT: '导出次数',
  }
  return names[resource] || resource
}
