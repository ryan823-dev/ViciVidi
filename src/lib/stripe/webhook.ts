import Stripe from 'stripe'
import { stripe } from '.'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 处理 Stripe Webhook 事件
 * 实现幂等性：通过 stripeEventId 唯一约束防止重复处理
 */
export async function handleWebhookEvent(event: Stripe.Event) {
  const eventId = event.id
  const eventType = event.type

  console.log(`🔔 处理 Webhook 事件：${eventId} (${eventType})`)

  try {
    // 1. 检查事件是否已处理（幂等性检查）
    const existingEvent = await prisma.paymentEvent.findUnique({
      where: { stripeEventId: eventId },
    })

    if (existingEvent) {
      console.log(`⚠️  事件已处理，跳过：${eventId}`)
      return
    }

    // 2. 根据事件类型处理
    await prisma.$transaction(async (tx) => {
      switch (event.type) {
        case 'customer.subscription.created':
          await handleSubscriptionCreated(event, tx)
          break

        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(event, tx)
          break

        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(event, tx)
          break

        case 'invoice.paid':
          await handleInvoicePaid(event, tx)
          break

        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(event, tx)
          break

        case 'customer.updated':
          await handleCustomerUpdated(event, tx)
          break

        default:
          console.log(`ℹ️  未处理的事件类型：${eventType}`)
      }
    })

    console.log(`✅ Webhook 事件处理完成：${eventId}`)
  } catch (error) {
    console.error(`❌ Webhook 事件处理失败：${eventId}`, error)
    throw error
  }
}

/**
 * 处理订阅创建事件
 * 创建订阅记录并发放月度积分
 */
async function handleSubscriptionCreated(
  event: Stripe.Event,
  tx: any
) {
  const subscription = event.data.object as Stripe.Subscription
  console.log(`📝 创建订阅：${subscription.id}`)

  // 获取客户信息
  const customer = await tx.billingCustomer.findFirst({
    where: { stripeCustomerId: subscription.customer as string },
  })

  if (!customer) {
    throw new Error(`未找到客户：${subscription.customer}`)
  }

  // 获取套餐定义
  const priceId = subscription.items.data[0]?.price.id
  const plan = await tx.planDefinition.findFirst({
    where: { stripePriceId: priceId },
  })

  if (!plan) {
    throw new Error(`未找到套餐定义：${priceId}`)
  }

  // 创建订阅记录
  const sub = subscription as any
  await tx.subscription.create({
    data: {
      id: `sub_${subscription.id.split('_')[1]}`, // 生成本地 ID
      billingCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      planId: plan.id,
      status: mapSubscriptionStatus(subscription.status),
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: false,
    },
  })

  // 发放月度积分
  await allocateCredits(
    customer.id,
    `sub_${subscription.id.split('_')[1]}`,
    plan.monthlyCredits,
    new Date(sub.current_period_start * 1000),
    new Date(sub.current_period_end * 1000),
    tx
  )
}

/**
 * 处理订阅更新事件
 */
async function handleSubscriptionUpdated(
  event: Stripe.Event,
  tx: any
) {
  const subscription = event.data.object as Stripe.Subscription
  const sub = subscription as any
  console.log(`🔄 更新订阅：${subscription.id}`)

  const localSubscription = await tx.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  })

  if (!localSubscription) {
    throw new Error(`未找到本地订阅记录：${subscription.id}`)
  }

  // 更新订阅状态
  await tx.subscription.update({
    where: { id: localSubscription.id },
    data: {
      status: mapSubscriptionStatus(subscription.status),
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      canceledAt: sub.canceled_at
        ? new Date(sub.canceled_at * 1000)
        : null,
    },
  })

  // 如果是新周期开始，发放积分
  const periodStart = new Date(sub.current_period_start * 1000)
  const existingPeriod = await tx.creditAllocationPeriod.findFirst({
    where: {
      subscriptionId: localSubscription.id,
      periodStart,
    },
  })

  if (!existingPeriod) {
    // 获取套餐定义
    const priceId = subscription.items.data[0]?.price.id
    const plan = await tx.planDefinition.findFirst({
      where: { stripePriceId: priceId },
    })

    if (plan) {
      await allocateCredits(
        localSubscription.billingCustomerId,
        localSubscription.id,
        plan.monthlyCredits,
        periodStart,
        new Date(sub.current_period_end * 1000),
        tx
      )
    }
  }
}

/**
 * 处理订阅删除事件
 */
async function handleSubscriptionDeleted(
  event: Stripe.Event,
  tx: any
) {
  const subscription = event.data.object as Stripe.Subscription
  console.log(`❌ 删除订阅：${subscription.id}`)

  await tx.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
    },
  })
}

/**
 * 处理发票支付成功事件
 */
async function handleInvoicePaid(event: Stripe.Event, tx: any) {
  const invoice = event.data.object as Stripe.Invoice
  const inv = invoice as any
  console.log(`💰 发票支付成功：${invoice.id}`)

  const customer = await tx.billingCustomer.findFirst({
    where: { stripeCustomerId: invoice.customer as string },
  })

  if (!customer) return

  // 创建支付事件记录
  await tx.paymentEvent.create({
    data: {
      billingCustomerId: customer.id,
      stripeEventId: event.id,
      stripeInvoiceId: invoice.id,
      eventType: event.type,
      amountCents: invoice.amount_paid || 0,
      currency: invoice.currency || 'usd',
      status: 'processed',
      metadata: event.data.object as any,
    },
  })

  // 创建发票记录
  await tx.invoiceRecord.upsert({
    where: { stripeInvoiceId: invoice.id },
    create: {
      billingCustomerId: customer.id,
      stripeInvoiceId: invoice.id,
      stripeSubscriptionId: inv.subscription as string | null,
      amountCents: invoice.amount_paid || 0,
      currency: invoice.currency || 'usd',
      status: 'paid',
      paidAt: new Date(),
      invoiceUrl: invoice.hosted_invoice_url || null,
    },
    update: {
      status: 'paid',
      paidAt: new Date(),
    },
  })
}

/**
 * 处理发票支付失败事件
 */
async function handleInvoicePaymentFailed(event: Stripe.Event, tx: any) {
  const invoice = event.data.object as Stripe.Invoice
  const inv = invoice as any
  console.log(`💸 发票支付失败：${invoice.id}`)

  const customer = await tx.billingCustomer.findFirst({
    where: { stripeCustomerId: invoice.customer as string },
  })

  if (!customer) return

  // 更新订阅状态为 PAST_DUE
  if (inv.subscription) {
    await tx.subscription.updateMany({
      where: { stripeSubscriptionId: inv.subscription as string },
      data: { status: 'PAST_DUE' },
    })
  }

  // 创建支付事件记录
  await tx.paymentEvent.create({
    data: {
      billingCustomerId: customer.id,
      stripeEventId: event.id,
      stripeInvoiceId: invoice.id,
      eventType: event.type,
      amountCents: invoice.amount_due || 0,
      currency: invoice.currency || 'usd',
      status: 'failed',
      metadata: event.data.object as any,
    },
  })
}

/**
 * 处理客户更新事件
 */
async function handleCustomerUpdated(event: Stripe.Event, tx: any) {
  const customer = event.data.object as Stripe.Customer
  console.log(`👤 更新客户：${customer.id}`)

  await tx.billingCustomer.update({
    where: { stripeCustomerId: customer.id },
    data: {
      stripeEmail: customer.email || '',
    },
  })
}

/**
 * 发放月度积分
 */
async function allocateCredits(
  billingCustomerId: string,
  subscriptionId: string,
  credits: number,
  periodStart: Date,
  periodEnd: Date,
  tx: any
) {
  console.log(`🎁 发放积分：${credits} credits`)

  // 1. 创建分配周期记录
  const period = await tx.creditAllocationPeriod.create({
    data: {
      billingCustomerId,
      subscriptionId,
      periodStart,
      periodEnd,
      allocatedCredits: credits,
      consumedCredits: 0,
      remainingCredits: credits,
      isProcessed: true,
      processedAt: new Date(),
    },
  })

  // 2. 计算当前余额
  const previousLedger = await tx.creditLedger.findFirst({
    where: { billingCustomerId },
    orderBy: { createdAt: 'desc' },
  })

  const previousBalance = previousLedger?.balanceAfter ?? 0
  const newBalance = previousBalance + credits

  // 3. 创建积分账本记录
  await tx.creditLedger.create({
    data: {
      billingCustomerId,
      subscriptionId,
      amount: credits,
      balanceAfter: newBalance,
      type: 'MONTHLY_ALLOCATION',
      description: `月度积分分配 - ${periodStart.toLocaleDateString()}`,
    },
  })

  console.log(`✅ 积分发放完成，新余额：${newBalance}`)
}

/**
 * 映射 Stripe 订阅状态到本地状态
 */
function mapSubscriptionStatus(
  status: Stripe.Subscription.Status
): any {
  const statusMap: Record<string, any> = {
    active: 'ACTIVE',
    past_due: 'PAST_DUE',
    unpaid: 'UNPAID',
    canceled: 'CANCELED',
    trialing: 'TRIALING',
    incomplete: 'INCOMPLETE',
    incomplete_expired: 'INCOMPLETE_EXPIRED',
    paused: 'PAUSED',
  }

  return statusMap[status] || 'ACTIVE'
}
