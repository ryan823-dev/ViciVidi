# ViciVidi AI 订阅计费系统规格说明书

**版本**: 1.0  
**创建日期**: 2026-03-14  
**域名**: vicividi.com  
**状态**: 待实施

---

## 目录

1. [总体架构设计](#1-总体架构设计)
2. [数据模型设计](#2-数据模型设计)
3. [Stripe 集成流程](#3-stripe 集成流程)
4. [Webhook 幂等性方案](#4-webhook 幂等性方案)
5. [月度 Credits 发放方案](#5-月度 credits 发放方案)
6. [订阅状态机与规则](#6-订阅状态机与规则)
7. [成本收益分析与毛利率估算](#7-成本收益分析与毛利率估算)
8. [实施计划](#8-实施计划)

---

## 1. 总体架构设计

### 1.1 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      ViciVidi AI 应用层                       │
├─────────────────────────────────────────────────────────────┤
│  用户界面层 (Next.js 16 + React)                              │
│  - 订阅管理页面                                               │
│  - 计费门户入口                                               │
│  - 使用量仪表板                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    API 路由层 (Next.js API Routes)            │
├─────────────────────────────────────────────────────────────┤
│  - /api/billing/checkout   创建结账会话                       │
│  - /api/billing/portal     创建门户会话                       │
│  - /api/billing/webhook    Stripe Webhook 处理器              │
│  - /api/billing/summary    获取计费摘要                       │
│  - /api/billing/ledger     获取积分账本                       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    业务逻辑层 (Services)                      │
├─────────────────────────────────────────────────────────────┤
│  - BillingService          订阅管理核心逻辑                   │
│  - CreditAllocationService 积分分配与消耗逻辑                 │
│  - WebhookHandler          Webhook 事件处理与幂等性            │
│  - StripeService           Stripe API 封装                    │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                      数据持久层 (Prisma ORM)                  │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                        │
│  - BillingCustomer         计费客户信息                       │
│  - Subscription            订阅记录                          │
│  - PlanDefinition          套餐定义                          │
│  - CreditLedger            积分账本（审计日志）                │
│  - CreditAllocationPeriod  积分分配周期                       │
│  - PaymentEvent            支付事件记录                       │
│  - InvoiceRecord           发票记录                          │
│  - UsageRecord             使用量记录                         │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  外部服务层 (Stripe Billing)                  │
├─────────────────────────────────────────────────────────────┤
│  - Checkout Session        Stripe Checkout 结账页面           │
│  - Customer Portal         客户自助管理门户                   │
│  - Billing Portal          支付管理与发票查看                 │
│  - Webhooks                异步事件通知                       │
│  - Products & Prices       产品与价格管理                     │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 核心设计原则

1. **审计合规**: 所有积分变动必须记录在 `CreditLedger` 中，不可篡改
2. **幂等性保证**: Webhook 处理必须支持重复事件去重
3. **周期隔离**: 月度积分按周期隔离，防止重复发放
4. **事务安全**: 关键操作使用数据库事务保证原子性
5. **用户友好**: 提供清晰的计费仪表板和自助管理入口

---

## 2. 数据模型设计

### 2.1 Prisma Schema

```prisma
// 计费客户信息（与 Stripe Customer 同步）
model BillingCustomer {
  id                  String   @id @default(cust_ + uuid(8))
  userId              String   @unique
  stripeCustomerId    String   @unique
  stripeEmail         String
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // 关联关系
  subscriptions       Subscription[]
  creditLedger        CreditLedger[]
  allocationPeriods   CreditAllocationPeriod[]
  paymentEvents       PaymentEvent[]
  invoices            InvoiceRecord[]
  usageRecords        UsageRecord[]
}

// 订阅记录（与 Stripe Subscription 同步）
model Subscription {
  id                  String   @id @default(sub_ + uuid(8))
  billingCustomerId   String
  stripeSubscriptionId String  @unique
  planId              String
  status              SubscriptionStatus
  currentPeriodStart  DateTime
  currentPeriodEnd    DateTime
  cancelAtPeriodEnd   Boolean  @default(false)
  canceledAt          DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // 关联关系
  customer            BillingCustomer @relation(fields: [billingCustomerId], references: [id])
  plan                PlanDefinition  @relation(fields: [planId], references: [id])
  paymentEvents       PaymentEvent[]
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  UNPAID
  CANCELED
  TRIALING
  INCOMPLETE
  INCOMPLETE_EXPIRED
  PAUSED
}

// 套餐定义（本地配置，与 Stripe Products 对应）
model PlanDefinition {
  id                  String   @id @default(plan_ + uuid(8))
  stripeProductId     String   @unique
  stripePriceId       String   @unique
  name                String
  description         String?
  monthlyCredits      Int
  priceCents          Int
  currency            String   @default("usd")
  billingInterval     String   // "month" | "year"
  isActive            Boolean  @default(true)
  features            Json?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // 关联关系
  subscriptions       Subscription[]
}

// 积分账本（审计日志，所有积分变动的完整记录）
model CreditLedger {
  id                  String   @id @default(ledger_ + uuid(8))
  billingCustomerId   String
  subscriptionId      String?
  amount              Int      // 正数=增加，负数=消耗
  balanceAfter        Int      // 变动后余额
  type                CreditType
  description         String
  metadata            Json?
  createdAt           DateTime @default(now())
  
  // 关联关系
  customer            BillingCustomer @relation(fields: [billingCustomerId], references: [id])
  subscription        Subscription? @relation(fields: [subscriptionId], references: [id])
}

enum CreditType {
  MONTHLY_ALLOCATION      // 月度分配
  BONUS_GRANT            // 奖励赠送
  API_CONSUMPTION        // API 调用消耗
  FEATURE_USAGE          // 功能使用消耗
  REFUND                 // 退款返还
  ADJUSTMENT             // 人工调整
}

// 积分分配周期（追踪每月积分发放，防止重复）
model CreditAllocationPeriod {
  id                  String   @id @default(period_ + uuid(8))
  billingCustomerId   String
  subscriptionId      String
  periodStart         DateTime
  periodEnd           DateTime
  allocatedCredits    Int
  consumedCredits     Int      @default(0)
  remainingCredits    Int
  isProcessed         Boolean  @default(false)
  processedAt         DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  // 关联关系
  customer            BillingCustomer @relation(fields: [billingCustomerId], references: [id])
  subscription        Subscription @relation(fields: [subscriptionId], references: [id])
  
  @@unique([subscriptionId, periodStart])
}

// 支付事件记录（Stripe 支付事件审计）
model PaymentEvent {
  id                  String   @id @default(evt_ + uuid(8))
  billingCustomerId   String
  subscriptionId      String?
  stripeEventId       String   @unique
  stripeInvoiceId     String?
  eventType           String   // "invoice.paid", "payment_failed", etc.
  amountCents         Int
  currency            String
  status              String
  metadata            Json?
  createdAt           DateTime @default(now())
  
  // 关联关系
  customer            BillingCustomer @relation(fields: [billingCustomerId], references: [id])
  subscription        Subscription? @relation(fields: [subscriptionId], references: [id])
}

// 发票记录（与 Stripe Invoices 同步）
model InvoiceRecord {
  id                  String   @id @default(inv_ + uuid(8))
  billingCustomerId   String
  stripeInvoiceId     String   @unique
  stripeSubscriptionId String?
  amountCents         Int
  currency            String
  status              String   // "paid", "open", "uncollectible", "void"
  dueDate             DateTime?
  paidAt              DateTime?
  invoiceUrl          String?
  metadata            Json?
  createdAt           DateTime @default(now())
  
  // 关联关系
  customer            BillingCustomer @relation(fields: [billingCustomerId], references: [id])
}

// 使用量记录（按功能模块追踪使用情况）
model UsageRecord {
  id                  String   @id @default(usage_ + uuid(8))
  billingCustomerId   String
  subscriptionId      String?
  featureType         String   // "ai_search", "intent_detection", "webhook_export"
  quantity            Int
  creditsConsumed     Int
  metadata            Json?
  createdAt           DateTime @default(now())
  
  // 关联关系
  customer            BillingCustomer @relation(fields: [billingCustomerId], references: [id])
  subscription        Subscription? @relation(fields: [subscriptionId], references: [id])
  
  @@index([billingCustomerId, createdAt])
  @@index([featureType, createdAt])
}
```

### 2.2 数据库索引优化

```prisma
// 关键索引
@@index([billingCustomerId, status])           // 查询活跃订阅
@@index([stripeCustomerId])                     // Stripe 事件反向查询
@@index([type, createdAt])                      // 账本类型统计
@@index([periodStart, periodEnd])               // 周期查询
```

---

## 3. Stripe 集成流程

### 3.1 产品与价格配置

在 Stripe Dashboard 中创建以下产品：

```yaml
Product: ViciVidi AI - Starter
- Price ID: price_starter_monthly
- Amount: $9900 (99 USD)
- Interval: month
- Monthly Credits: 100

Product: ViciVidi AI - Scale
- Price ID: price_scale_monthly
- Amount: $29900 (299 USD)
- Interval: month
- Monthly Credits: 500

Product: ViciVidi AI - Pro
- Price ID: price_pro_monthly
- Amount: $99900 (999 USD)
- Interval: month
- Monthly Credits: 2000
```

### 3.2 Checkout Session 创建流程

```typescript
// API Route: /api/billing/checkout
POST /api/billing/checkout
Request: { planId: string }
Response: { checkoutUrl: string }

流程:
1. 验证用户登录状态
2. 检查是否已有 Stripe Customer
   - 无：创建 Stripe Customer
   - 有：复用现有 Customer
3. 创建 Stripe Checkout Session
   - mode: "subscription"
   - line_items: [selected plan]
   - subscription_data: { metadata: { userId, planId } }
   - success_url: ${BASE_URL}/billing?success=true
   - cancel_url: ${BASE_URL}/billing?canceled=true
4. 返回 checkoutUrl 给前端
5. 前端重定向到 Stripe Checkout
```

### 3.3 Customer Portal 集成

```typescript
// API Route: /api/billing/portal
POST /api/billing/portal

流程:
1. 验证用户登录状态
2. 获取用户的 Stripe Customer ID
3. 创建 Stripe Billing Portal Session
   - return_url: ${BASE_URL}/billing
   - flow_data: { type: "subscription_update" } (可选)
4. 返回 portalUrl 给前端
5. 用户可在 Portal 中:
   - 升级/降级套餐
   - 取消订阅
   - 更新支付方式
   - 查看历史发票
```

### 3.4 Webhook 事件处理

```typescript
// API Route: /api/billing/webhook
POST /api/billing/webhook
Headers: stripe-signature

需要处理的事件:
- customer.subscription.created    → 创建订阅记录，发放月度积分
- customer.subscription.updated    → 更新订阅状态，处理升降级
- customer.subscription.deleted    → 标记订阅取消
- invoice.paid                     → 记录支付成功，创建发票
- invoice.payment_failed           → 标记订阅为 PAST_DUE
- customer.updated                 → 同步客户信息
```

---

## 4. Webhook 幂等性方案

### 4.1 幂等性实现原理

```typescript
// 核心逻辑：使用 Stripe Event ID 作为唯一键
async function handleWebhook(event: Stripe.Event) {
  const eventId = event.id; // evt_1234567890
  
  // 1. 检查事件是否已处理
  const existingEvent = await prisma.paymentEvent.findUnique({
    where: { stripeEventId: eventId }
  });
  
  if (existingEvent) {
    // 已处理，直接返回（幂等性保证）
    return { success: true, idempotent: true };
  }
  
  // 2. 使用事务处理事件
  await prisma.$transaction(async (tx) => {
    // 2.1 记录事件
    await tx.paymentEvent.create({
      data: {
        stripeEventId: eventId,
        // ...其他字段
      }
    });
    
    // 2.2 根据事件类型执行对应逻辑
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event, tx);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event, tx);
        break;
      // ...其他事件
    }
  });
}
```

### 4.2 并发控制

```typescript
// 使用数据库唯一约束防止并发插入
model PaymentEvent {
  stripeEventId String @unique // 唯一约束保证幂等性
}

// 使用事务保证原子性
await prisma.$transaction([
  // 操作 1: 创建事件记录
  // 操作 2: 更新订阅状态
  // 操作 3: 创建积分账本记录
]);
```

### 4.3 Webhook 签名验证

```typescript
import { buffer } from 'micro';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await buffer(req);
  const signature = req.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body.toString(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }
  
  // 处理事件...
}
```

---

## 5. 月度 Credits 发放方案

### 5.1 发放时机

```typescript
// 触发条件：subscription.created 或 subscription.updated (新周期开始)
async function handleSubscriptionCreated(
  event: Stripe.Event,
  tx: PrismaTransaction
) {
  const subscription = event.data.object as Stripe.Subscription;
  
  // 检查是否已存在该周期的分配记录
  const periodStart = new Date(subscription.current_period_start * 1000);
  const periodEnd = new Date(subscription.current_period_end * 1000);
  
  const existingPeriod = await tx.creditAllocationPeriod.findFirst({
    where: {
      stripeSubscriptionId: subscription.id,
      periodStart
    }
  });
  
  if (existingPeriod) {
    // 防止重复发放
    return;
  }
  
  // 获取套餐定义的积分数量
  const plan = await getPlanByStripeProductId(subscription.items.data[0].price.product as string);
  
  // 创建分配周期记录
  await tx.creditAllocationPeriod.create({
    data: {
      billingCustomerId: ...,
      subscriptionId: ...,
      periodStart,
      periodEnd,
      allocatedCredits: plan.monthlyCredits,
      remainingCredits: plan.monthlyCredits,
      isProcessed: true,
      processedAt: new Date()
    }
  });
  
  // 创建积分账本记录
  await tx.creditLedger.create({
    data: {
      billingCustomerId: ...,
      subscriptionId: ...,
      amount: plan.monthlyCredits,
      balanceAfter: calculateCurrentBalance(...),
      type: 'MONTHLY_ALLOCATION',
      description: `月度积分分配 - ${plan.name} (${formatDate(periodStart)})`
    }
  });
}
```

### 5.2 积分消耗逻辑

```typescript
// API 调用时扣除积分
async function consumeCredits(
  userId: string,
  featureType: string,
  quantity: number,
  creditsPerUnit: number
) {
  const totalCredits = quantity * creditsPerUnit;
  
  return prisma.$transaction(async (tx) => {
    // 1. 检查当前周期剩余积分
    const currentPeriod = await tx.creditAllocationPeriod.findFirst({
      where: {
        billingCustomerId: userId,
        periodStart: { lte: new Date() },
        periodEnd: { gte: new Date() }
      },
      orderBy: { periodStart: 'desc' }
    });
    
    if (!currentPeriod || currentPeriod.remainingCredits < totalCredits) {
      throw new Error('INSUFFICIENT_CREDITS');
    }
    
    // 2. 更新周期记录
    await tx.creditAllocationPeriod.update({
      where: { id: currentPeriod.id },
      data: {
        consumedCredits: { increment: totalCredits },
        remainingCredits: { decrement: totalCredits }
      }
    });
    
    // 3. 创建积分账本记录
    await tx.creditLedger.create({
      data: {
        billingCustomerId: userId,
        amount: -totalCredits,
        balanceAfter: calculateCurrentBalance(...),
        type: 'API_CONSUMPTION',
        description: `${featureType} 使用 - ${quantity} 次`
      }
    });
    
    // 4. 创建使用量记录
    await tx.usageRecord.create({
      data: {
        billingCustomerId: userId,
        featureType,
        quantity,
        creditsConsumed: totalCredits
      }
    });
    
    return { success: true };
  });
}
```

### 5.3 积分余额查询

```typescript
// 获取用户当前积分余额
async function getCreditBalance(userId: string) {
  const periods = await prisma.creditAllocationPeriod.findMany({
    where: {
      billingCustomerId: userId,
      isProcessed: true
    },
    orderBy: { periodStart: 'desc' },
    take: 12 // 最近 12 个月
  });
  
  const totalRemaining = periods.reduce(
    (sum, p) => sum + p.remainingCredits,
    0
  );
  
  return {
    totalCredits: totalRemaining,
    periods: periods.map(p => ({
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      allocated: p.allocatedCredits,
      consumed: p.consumedCredits,
      remaining: p.remainingCredits
    }))
  };
}
```

---

## 6. 订阅状态机与规则

### 6.1 订阅状态流转图

```
┌──────────────┐
│  INCOMPLETE  │ ─────► INCOMPLETE_EXPIRED (24h 未完成支付)
└──────┬───────┘
       │
       ▼ (支付成功)
┌──────────────┐
│    ACTIVE    │ ◄────────────────────┐
└──────┬───────┘                      │
       │                              │
       │ (支付失败)                    │ (续费成功)
       ▼                              │
┌──────────────┐                      │
│  PAST_DUE    │ ─────────────────────┘
└──────┬───────┘
       │
       │ (宽限期 7 天)
       ▼
┌──────────────┐
│   CANCELED   │
└──────────────┘
```

### 6.2 升降级规则

```typescript
// 升级规则 (立即生效)
interface UpgradeRule {
  fromPlan: string;
  toPlan: string;
  effectiveImmediately: boolean;
  prorationBehavior: 'create_prorations' | 'none' | 'always_invoice';
  creditHandling: 'carry_over' | 'forfeit' | 'pro_rated';
}

const upgradeRules: UpgradeRule[] = [
  {
    fromPlan: 'starter',
    toPlan: 'scale',
    effectiveImmediately: true,
    prorationBehavior: 'create_prorations',
    creditHandling: 'carry_over' // 剩余积分保留
  },
  {
    fromPlan: 'scale',
    toPlan: 'pro',
    effectiveImmediately: true,
    prorationBehavior: 'create_prorations',
    creditHandling: 'carry_over'
  }
];

// 降级规则 (周期结束时生效)
interface DowngradeRule {
  fromPlan: string;
  toPlan: string;
  effectiveAt: 'period_end' | 'immediate';
  creditHandling: 'forfeit' | 'carry_over';
}

const downgradeRules: DowngradeRule[] = [
  {
    fromPlan: 'pro',
    toPlan: 'scale',
    effectiveAt: 'period_end', // 当前周期结束后生效
    creditHandling: 'forfeit'  // 降级后多余积分作废
  },
  {
    fromPlan: 'scale',
    toPlan: 'starter',
    effectiveAt: 'period_end',
    creditHandling: 'forfeit'
  }
];
```

### 6.3 取消订阅规则

```typescript
// 取消订阅策略
interface CancellationPolicy {
  cancelAtPeriodEnd: boolean;  // true=周期结束取消，false=立即取消
  refundPolicy: 'none' | 'pro_rated' | 'full';
  gracePeriodDays: number;     // 宽限期
  winbackOfferEnabled: boolean; // 是否提供挽留优惠
}

const cancellationPolicy: CancellationPolicy = {
  cancelAtPeriodEnd: true,     // 用户可随时取消，访问到周期结束
  refundPolicy: 'none',        // 不支持退款
  gracePeriodDays: 7,          // 支付失败后 7 天宽限期
  winbackOfferEnabled: true    // 提供 50% 折扣挽留
};
```

### 6.4 试用规则

```typescript
// 试用期配置
interface TrialConfig {
  trialPeriodDays: number;
  trialCredits: number;
  requirePaymentMethod: boolean;
  autoConvert: boolean;
}

const trialConfig: TrialConfig = {
  trialPeriodDays: 14,        // 14 天试用
  trialCredits: 50,           // 试用期间提供 50 积分
  requirePaymentMethod: true,  // 需要绑定支付方式
  autoConvert: true           // 试用结束自动转为付费订阅
};
```

---

## 7. 成本收益分析与毛利率估算

### 7.1 收入模型

| 套餐 | 月费 (USD) | 包含积分 | 额外积分单价 | 目标客户 |
|------|-----------|---------|-------------|---------|
| Starter | $99 | 100 | $1.5/积分 | 小型企业/初创公司 |
| Scale | $299 | 500 | $1.2/积分 | 中型企业 |
| Pro | $999 | 2000 | $1.0/积分 | 大型企业 |

**假设场景**: 100 个付费客户分布
- Starter: 50 家 ($4,950/月)
- Scale: 35 家 ($10,465/月)
- Pro: 15 家 ($14,985/月)
- **月度总收入**: $30,400
- **年度总收入**: $364,800

### 7.2 成本结构分析

#### 7.2.1 固定成本 (月度)

| 成本项 | 金额 (USD/月) | 说明 |
|--------|--------------|------|
| Vercel Pro | $20 | 托管费用 |
| Supabase Pro | $25 | 数据库 |
| 域名 SSL | $2 | vicividi.com |
| Stripe 固定费用 | $0 | 无月费 |
| **固定成本小计** | **$47/月** | |

#### 7.2.2 可变成本 - 数据源成本

**免费数据源** (成本 = $0):
- 官方注册信息 (政府公开数据)
- 公司官网信息
- 公开招投标平台
- 社交媒体公开数据

**付费数据源** (预估成本):

| 数据源 | 用途 | 成本 (USD/月) | 覆盖客户数 |
|--------|------|--------------|-----------|
| API 层数据集成 | 基础信息补充 | $50 | 100+ |
| 付费企业信息 API | 深度数据 | $200 | 100+ |
| 行业数据库 | 行业分类 | $100 | 100+ |
| **数据源小计** | | **$350/月** | |

#### 7.2.3 AI 功能成本 (按使用量)

**假设每个客户平均使用行为**:
- AI 搜索：20 次/月
- 意图检测：50 次/月
- Webhook 导出：10 次/月

| 功能 | 单次成本 (USD) | 月使用次数 | 月成本 (USD) |
|------|--------------|-----------|-------------|
| AI 搜索 | $0.05 | 2,000 (100 客户×20) | $100 |
| 意图检测 | $0.02 | 5,000 (100 客户×50) | $100 |
| Webhook 导出 | $0.10 | 1,000 (100 客户×10) | $100 |
| **AI 成本小计** | | | **$300/月** |

#### 7.2.4 支付手续费 (Stripe)

Stripe 费率：2.9% + $0.30 / 笔

| 套餐 | 月费 | 手续费率 | 单笔手续费 | 月手续费 (100 客户) |
|------|------|---------|-----------|-------------------|
| 平均 | $304 | 2.9% + $0.30 | $9.12 | $912/月 |

### 7.3 毛利率测算

#### 场景 1: 保守估计 (50 客户)

**收入**:
- Starter (25 家): $2,475
- Scale (17 家): $5,083
- Pro (8 家): $7,992
- **月度总收入**: $15,550

**成本**:
- 固定成本：$47
- 数据源成本：$350
- AI 使用成本：$150 (50 客户)
- 支付手续费：$481
- **月度总成本**: $1,028

**毛利率**: (15,550 - 1,028) / 15,550 = **93.4%**

#### 场景 2: 中等估计 (100 客户)

**收入**: $30,400 (见 7.1)

**成本**:
- 固定成本：$47
- 数据源成本：$350
- AI 使用成本：$300
- 支付手续费：$912
- **月度总成本**: $1,609

**毛利率**: (30,400 - 1,609) / 30,400 = **94.7%**

#### 场景 3: 乐观估计 (500 客户)

**收入** (假设分布相同):
- Starter (250 家): $24,750
- Scale (175 家): $52,325
- Pro (75 家): $74,925
- **月度总收入**: $152,000

**成本**:
- 固定成本：$47
- 数据源成本：$800 (需要更多数据源)
- AI 使用成本：$1,500 (500 客户)
- 支付手续费：$4,558
- **月度总成本**: $6,905

**毛利率**: (152,000 - 6,905) / 152,000 = **95.5%**

### 7.4 单位经济效益 (Unit Economics)

#### 每客户平均收益 (ARPU)

| 指标 | 数值 |
|------|------|
| 平均月收入 | $304 |
| 平均月成本 | $16 (100 客户场景) |
| 单客户毛利 | $288 |
| 毛利率 | 94.7% |

#### 客户生命周期价值 (LTV)

假设:
- 平均客户留存时间：18 个月
- 月毛利率：94.7%
- 折扣率：10%

LTV = $288 × 18 × 0.947 = **$4,902**

#### 客户获取成本 (CAC)

假设获客渠道:
- Google Ads: $500/客户
- 内容营销：$200/客户
- 转介绍：$100/客户
- **加权平均 CAC**: $300

#### LTV/CAC 比率

LTV/CAC = $4,902 / $300 = **16.3**

**健康度评估**: 远超 3:1 的健康标准，商业模式可持续性强

### 7.5 盈亏平衡分析

**月度固定成本**: $397 (固定$47 + 数据源$350)

**单客户边际贡献**: $288 (收入$304 - 可变成本$16)

**盈亏平衡客户数**: $397 / $288 ≈ **2 个客户**

**结论**: 仅需 2 个付费客户即可覆盖固定成本，风险极低

### 7.6 敏感性分析

#### 最坏情况 (20% 客户流失 + 数据成本翻倍)

- 客户数：80 家
- 收入：$24,320
- 成本：$2,059 (数据成本$700)
- 毛利率：91.5% (仍保持高水平)

#### 最好情况 (20% 增长 + AI 成本优化 30%)

- 客户数：120 家
- 收入：$36,480
- 成本：$1,756 (AI 成本$210)
- 毛利率：95.2%

### 7.7 成本优化建议

1. **数据源优化**
   - 优先使用免费数据源 (官方注册信息、公开招投标)
   - 付费 API 按需调用，缓存结果减少重复请求
   - 与数据供应商谈判批量折扣

2. **AI 成本优化**
   - 实现请求缓存，避免重复计算
   - 批量处理请求，降低 API 调用次数
   - 使用模型蒸馏降低单次调用成本

3. **支付优化**
   - 鼓励年付 (给予 15% 折扣) 减少手续费频次
   - 大额订单使用银行转账避免手续费

---

## 8. 实施计划

### 8.1 第一阶段：最小可行产品 (MVP) - 5 天

**目标**: 实现订阅创建、支付、积分发放闭环

**任务清单**:

#### Day 1-2: 数据库与基础架构
- [ ] 创建 Prisma Schema 迁移
- [ ] 生成 Prisma Client
- [ ] 创建 PlanDefinition 种子数据
- [ ] 配置 Stripe Products & Prices

#### Day 3: Stripe 集成
- [ ] 实现 /api/billing/checkout 接口
- [ ] 实现 /api/billing/portal 接口
- [ ] 前端订阅管理页面 UI

#### Day 4: Webhook 处理
- [ ] 实现 /api/billing/webhook 接口
- [ ] 配置 Stripe Webhook 端点
- [ ] 实现 subscription.created 事件处理
- [ ] 实现 invoice.paid 事件处理

#### Day 5: 积分发放与测试
- [ ] 实现月度积分自动发放
- [ ] 端到端测试 (创建订阅 → 发放积分 → 查询余额)
- [ ] 部署到 Vercel
- [ ] 配置生产环境 Stripe

**交付物**:
- 用户可订阅套餐
- 支付成功后自动发放积分
- 可查看积分余额

### 8.2 第二阶段：积分消耗与使用量追踪 - 3 天

**目标**: 实现 API 调用时扣除积分

**任务清单**:
- [ ] 创建 CreditConsumptionService
- [ ] 集成到 AI 搜索功能
- [ ] 集成到意图检测功能
- [ ] 集成到 Webhook 导出功能
- [ ] 创建使用量记录
- [ ] 积分不足时优雅降级

**交付物**:
- API 调用自动扣除积分
- 积分不足时提示升级

### 8.3 第三阶段：计费仪表板 - 3 天

**目标**: 提供完整的计费管理界面

**任务清单**:
- [ ] 计费总览页面 (当前套餐、剩余积分、使用趋势)
- [ ] 积分账本查询 (所有积分变动记录)
- [ ] 使用量分析 (按功能分类统计)
- [ ] 历史发票列表
- [ ] 订阅管理 (升级/降级/取消)

**交付物**:
- 完整的计费管理仪表板
- 透明的使用量追踪

### 8.4 第四阶段：高级功能 - 5 天

**目标**: 增强功能与优化体验

**任务清单**:
- [ ] 订阅升降级 (立即生效/周期结束生效)
- [ ] 试用套餐 (14 天免费试用)
- [ ] 优惠券系统
- [ ] 邮件通知 (支付成功、积分不足、订阅到期)
- [ ] 积分预警 (低于 20% 时提醒)

**交付物**:
- 完整的订阅生命周期管理
- 用户友好的通知系统

### 8.5 第五阶段：监控与优化 - 2 天

**目标**: 生产环境监控与性能优化

**任务清单**:
- [ ] Webhook 失败重试监控
- [ ] 积分异常检测 (重复发放、负余额)
- [ ] 收入报表生成
- [ ] 性能优化 (数据库索引、缓存)
- [ ] 文档完善

**交付物**:
- 生产就绪的计费系统
- 完整的运维文档

### 8.6 时间线总览

```
Week 1: [██████████] Phase 1 - MVP (5 天)
Week 2: [██████    ] Phase 2 - 积分消耗 (3 天)
Week 3: [██████    ] Phase 3 - 仪表板 (3 天)
Week 4: [██████████] Phase 4 - 高级功能 (5 天)
Week 5: [████      ] Phase 5 - 监控优化 (2 天)

总计：18 个工作日 (约 3.5 周)
```

---

## 附录 A: API 设计

### A.1 创建结账会话

```http
POST /api/billing/checkout
Content-Type: application/json
Authorization: Bearer <token>

{
  "planId": "plan_starter"
}

Response: 200 OK
{
  "checkoutUrl": "https://checkout.stripe.com/c/..."
}
```

### A.2 创建门户会话

```http
POST /api/billing/portal
Authorization: Bearer <token>

Response: 200 OK
{
  "portalUrl": "https://billing.stripe.com/p/..."
}
```

### A.3 获取计费摘要

```http
GET /api/billing/summary
Authorization: Bearer <token>

Response: 200 OK
{
  "currentPlan": {
    "name": "Scale",
    "monthlyCredits": 500,
    "priceCents": 29900
  },
  "credits": {
    "totalRemaining": 342,
    "currentPeriodStart": "2026-03-01T00:00:00Z",
    "currentPeriodEnd": "2026-03-31T23:59:59Z"
  },
  "subscription": {
    "status": "ACTIVE",
    "cancelAtPeriodEnd": false
  }
}
```

### A.4 获取积分账本

```http
GET /api/billing/ledger?limit=50
Authorization: Bearer <token>

Response: 200 OK
{
  "entries": [
    {
      "id": "ledger_abc123",
      "amount": 500,
      "balanceAfter": 500,
      "type": "MONTHLY_ALLOCATION",
      "description": "月度积分分配 - Scale (2026-03-01)",
      "createdAt": "2026-03-01T00:00:00Z"
    },
    {
      "id": "ledger_def456",
      "amount": -20,
      "balanceAfter": 480,
      "type": "API_CONSUMPTION",
      "description": "ai_search 使用 - 10 次",
      "createdAt": "2026-03-02T10:30:00Z"
    }
  ]
}
```

---

## 附录 B: Stripe Webhook 配置

### B.1 本地测试

```bash
# 安装 Stripe CLI
stripe login

# 转发 webhook 到本地
stripe listen --forward-to localhost:3000/api/billing/webhook

# 触发测试事件
stripe trigger customer.subscription.created
```

### B.2 生产配置

1. 在 Stripe Dashboard 添加 Webhook 端点:
   - URL: `https://vicividi.com/api/billing/webhook`
   - 监听事件:
     - customer.subscription.created
     - customer.subscription.updated
     - customer.subscription.deleted
     - invoice.paid
     - invoice.payment_failed
     - customer.updated

2. 复制 Webhook 签名密钥到环境变量:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## 附录 C: 环境变量清单

```bash
# Stripe 配置
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 产品 ID 映射
STRIPE_PRODUCT_ID_STARTER=prod_...
STRIPE_PRICE_ID_STARTER=price_...
STRIPE_PRODUCT_ID_SCALE=prod_...
STRIPE_PRICE_ID_SCALE=price_...
STRIPE_PRODUCT_ID_PRO=prod_...
STRIPE_PRICE_ID_PRO=price_...

# 应用配置
NEXT_PUBLIC_APP_URL=https://vicividi.com
```

---

## 修订历史

| 版本 | 日期 | 修订内容 | 作者 |
|------|------|---------|------|
| 1.0 | 2026-03-14 | 初始版本 | ViciVidi AI 工程团队 |

---

**文档状态**: ✅ 完成  
**下一步**: 等待确认后开始 Phase 1 实施
