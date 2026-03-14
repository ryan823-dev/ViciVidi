import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

/**
 * 创建或获取 Stripe Customer
 */
export async function createOrGetCustomer(
  userId: string,
  email: string
): Promise<string> {
  // 这里应该先查询数据库检查是否已存在
  // 简化版本：直接创建新的 customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  })

  return customer.id
}

/**
 * 创建 Checkout Session
 */
export async function createCheckoutSession(params: {
  customerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
}) {
  const { customerId, priceId, successUrl, cancelUrl } = params

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        // 这里可以传入 planId 等信息
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  })

  return session
}

/**
 * 创建 Billing Portal Session
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
 * 获取 Subscription 详情
 */
export async function getSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  return subscription
}

/**
 * 取消 Subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId)
  return subscription
}

/**
 * 更新 Subscription
 */
export async function updateSubscription(
  subscriptionId: string,
  updates: Partial<Stripe.SubscriptionUpdateParams>
) {
  const subscription = await stripe.subscriptions.update(
    subscriptionId,
    updates
  )
  return subscription
}
