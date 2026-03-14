/**
 * Stripe Webhook API
 * POST: 处理 Stripe 事件通知
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleWebhookEvent, handleSubscriptionCreated, handleSubscriptionUpdated, handleSubscriptionDeleted } from '@/lib/services/stripe'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature') || ''

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // 在开发模式下，直接返回成功
    const isDev = !process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET === 'whsec_mock'
    
    if (isDev) {
      console.log('[DEV MODE] Webhook received:', body)
      return NextResponse.json({ received: true })
    }

    // 生产模式：验证并处理事件
    const event = await handleWebhookEvent(Buffer.from(body), signature)

    console.log('Stripe event:', event.type)

    // 处理不同类型的事件
    switch (event.type) {
      case 'checkout.session.completed':
        // 订阅创建成功
        await handleSubscriptionCreated(event)
        break

      case 'customer.subscription.updated':
        // 订阅更新（升级/降级）
        await handleSubscriptionUpdated(event)
        break

      case 'customer.subscription.deleted':
        // 订阅取消
        await handleSubscriptionDeleted(event)
        break

      case 'invoice.payment_succeeded':
        // 支付成功（续费）
        const invoice = event.data.object
        // 更新订阅状态
        break

      case 'invoice.payment_failed':
        // 支付失败
        const failedInvoice = event.data.object
        // 通知用户，标记订阅为 overdue
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook 处理失败', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
