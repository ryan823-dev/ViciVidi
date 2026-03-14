/**
 * Stripe 支付服务
 * 处理订阅、支付、webhook 等
 */

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2026-02-25.clover',
})

// 产品价格 ID（需要根据实际 Stripe 配置填写）
const PRICE_IDS = {
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

/**
 * 创建结账会话
 */
export async function createCheckoutSession(params: {
  userId: string
  plan: 'PRO' | 'BUSINESS' | 'ENTERPRISE'
  interval: 'monthly' | 'yearly'
  successUrl: string
  cancelUrl: string
}) {
  const { userId, plan, interval, successUrl, cancelUrl } = params

  const priceId = PRICE_IDS[plan][interval]

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'alipay'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      plan,
      interval,
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    customer_email: undefined, // 从用户数据中获取
  })

  return session
}

/**
 * 创建门户会话（管理订阅）
 */
export async function createPortalSession(params: {
  customerId: string
  returnUrl: string
}) {
  const { customerId, returnUrl } = params

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

/**
 * 处理 webhook 事件
 */
export async function handleWebhookEvent(
  payload: Buffer,
  signature: string
): Promise<Stripe.Event> {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    endpointSecret
  )

  return event
}

/**
 * 处理订阅成功
 */
export async function handleSubscriptionCreated(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session
  
  const { userId, plan, interval } = session.metadata || {}
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  )

  if (!userId || !plan) {
    throw new Error('Missing metadata in subscription')
  }

  // TODO: 更新用户配额
  // await upgradePlan(userId, plan as Plan)
  // await prisma.userSubscription.create({ ... })

  return {
    userId,
    plan,
    interval,
    subscriptionId: subscription.id,
    status: subscription.status,
  }
}

/**
 * 处理订阅更新
 */
export async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  
  // 处理套餐升级/降级
  // 更新用户配额

  return {
    subscriptionId: subscription.id,
    status: subscription.status,
  }
}

/**
 * 处理订阅取消
 */
export async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  
  // 降级为 STARTER 套餐
  // 更新用户配额

  return {
    subscriptionId: subscription.id,
  }
}

/**
 * 获取 Stripe 实例（用于高级操作）
 */
export function getStripe() {
  return stripe
}

export default stripe
