import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { handleWebhookEvent } from '@/lib/stripe/webhook'

/**
 * POST /api/billing/webhook
 * Stripe Webhook 处理器
 * 
 * 重要：这个端点不需要 auth，因为 Stripe 会使用签名验证
 */
export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature')!

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    // 验证 Webhook 签名
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // 处理事件（异步，不等待完成）
  handleWebhookEvent(event).catch(console.error)

  // 立即返回成功，避免超时
  return NextResponse.json({ received: true })
}
