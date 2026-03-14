# ViciVidi AI 订阅计费系统实施指南

## Phase 1 完成状态 ✅

### 已完成的功能

- [x] 数据库 Schema 设计（7 个核心模型）
- [x] Stripe 服务层封装
- [x] Webhook 处理器（支持幂等性）
- [x] API 路由实现：
  - `POST /api/billing/checkout` - 创建结账会话
  - `POST /api/billing/portal` - 创建门户会话
  - `POST /api/billing/webhook` - Stripe Webhook 处理器
  - `GET /api/billing/summary` - 获取计费摘要
  - `GET /api/billing/ledger` - 获取积分账本

---

## Stripe 配置步骤

### 步骤 1: 创建 Stripe 账户

1. 访问 https://stripe.com 注册账户
2. 切换到测试模式（Toggle Test Mode）
3. 获取 API 密钥：https://dashboard.stripe.com/test/apikeys

### 步骤 2: 配置环境变量

复制 `.env.example` 到 `.env` 并填写 Stripe 密钥：

```bash
# Stripe API Keys
STRIPE_SECRET_KEY="sk_test_51Q..."
STRIPE_PUBLISHABLE_KEY="pk_test_51Q..."

# Stripe Webhook Secret (步骤 5 会获取)
STRIPE_WEBHOOK_SECRET="whsec_..."

# 应用 URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 步骤 3: 创建 Products & Prices

在 Stripe Dashboard 创建三个产品：

#### 1. Starter Plan

```
Product Name: ViciVidi AI - Starter
Description: 适合小型团队和初创公司
Pricing: $99.00 USD / month
Billing Period: Monthly
Metadata:
  - planId: plan_starter
  - monthlyCredits: 100
```

#### 2. Scale Plan

```
Product Name: ViciVidi AI - Scale
Description: 适合成长型中型企业
Pricing: $299.00 USD / month
Billing Period: Monthly
Metadata:
  - planId: plan_scale
  - monthlyCredits: 500
```

#### 3. Pro Plan

```
Product Name: ViciVidi AI - Pro
Description: 适合大型企业和高 volume 使用
Pricing: $999.00 USD / month
Billing Period: Monthly
Metadata:
  - planId: plan_pro
  - monthlyCredits: 2000
```

### 步骤 4: 更新数据库套餐定义

运行种子数据脚本：

```bash
# 安装依赖
npm install -D tsx

# 运行种子数据
npm run db:seed
```

然后在 Stripe Dashboard 复制 Product ID 和 Price ID，更新数据库：

```bash
# 打开 Prisma Studio
npm run db:studio

# 访问 http://localhost:5555
# 编辑 plan_definitions 表，填入真实的 stripeProductId 和 stripePriceId
```

或者直接使用 SQL 更新：

```sql
UPDATE plan_definitions 
SET 
  stripe_product_id = 'prod_Qxx...',  -- 从 Stripe 复制
  stripe_price_id = 'price_Qxx...'     -- 从 Stripe 复制
WHERE id = 'plan_starter';

-- 对 plan_scale 和 plan_pro 重复上述操作
```

### 步骤 5: 配置 Webhook

#### 本地开发

1. 安装 Stripe CLI：
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows (使用 Scoop)
   scoop install stripe
   
   # 或直接下载：https://github.com/stripe/stripe-cli/releases
   ```

2. 登录 Stripe：
   ```bash
   stripe login
   ```

3. 转发 Webhook 到本地：
   ```bash
   stripe listen --forward-to localhost:3000/api/billing/webhook
   ```

   输出会显示 Webhook Secret：
   ```
   Ready! Your webhook signing secret is whsec_xxxxx
   ```

4. 将 signing secret 添加到 `.env`：
   ```bash
   STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
   ```

5. （可选）触发测试事件：
   ```bash
   # 触发订阅创建事件
   stripe trigger customer.subscription.created
   
   # 触发发票支付事件
   stripe trigger invoice.paid
   ```

#### 生产环境

1. 在 Stripe Dashboard 创建 Webhook：
   - 访问：https://dashboard.stripe.com/test/webhooks
   - 点击 "Add endpoint"

2. 配置 Webhook：
   ```
   Endpoint URL: https://vicividi.com/api/billing/webhook
   Events to send:
     - customer.subscription.created
     - customer.subscription.updated
     - customer.subscription.deleted
     - invoice.paid
     - invoice.payment_failed
     - customer.updated
   ```

3. 复制 Webhook Signing Secret 并添加到生产环境变量

### 步骤 6: 数据库迁移

```bash
# 生成 Prisma Client
npm run db:generate

# 推送 Schema 到数据库（开发环境）
npm run db:push

# 或创建迁移文件（生产环境）
npm run db:migrate
```

---

## 测试流程

### 测试订阅流程

1. **启动开发服务器**：
   ```bash
   npm run dev
   ```

2. **访问登录页面**：
   http://localhost:3000/login

3. **登录到应用**

4. **访问订阅管理页面**：
   http://localhost:3000/subscription/manage

5. **点击"订阅"按钮**，会调用 `/api/billing/checkout`

6. **完成 Stripe Checkout 支付**（使用测试卡）：
   - 卡号：4242 4242 4242 4242
   - 过期：任意未来日期
   - CVC：任意 3 位数字
   - ZIP：任意 5 位数字

7. **支付成功后**，会自动跳转到 `/payment/success`

8. **检查数据库**：
   - `subscriptions` 表应该有新的订阅记录
   - `credit_ledger` 表应该有积分发放记录
   - `credit_allocation_periods` 表应该有当前周期记录

### 测试 Webhook

```bash
# 在另一个终端运行 Stripe CLI
stripe listen --forward-to localhost:3000/api/billing/webhook

# 触发测试事件
stripe trigger customer.subscription.created
```

检查控制台日志，应该看到：
```
🔔 处理 Webhook 事件：evt_xxx (customer.subscription.created)
📝 创建订阅：sub_xxx
🎁 发放积分：100 credits
✅ 积分发放完成，新余额：100
✅ Webhook 事件处理完成：evt_xxx
```

### 测试计费门户

1. 访问订阅管理页面
2. 点击"管理订阅"按钮
3. 会跳转到 Stripe Billing Portal
4. 可以测试：
   - 升级/降级套餐
   - 取消订阅
   - 更新支付方式
   - 查看历史发票

---

## API 使用示例

### 创建订阅

```typescript
const response = await fetch('/api/billing/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ planId: 'plan_starter' }),
})

const { checkoutUrl } = await response.json()

// 重定向到 Stripe Checkout
window.location.href = checkoutUrl
```

### 获取计费摘要

```typescript
const response = await fetch('/api/billing/summary')
const summary = await response.json()

console.log(summary)
// {
//   hasSubscription: true,
//   currentPlan: { name: 'Starter', monthlyCredits: 100, priceCents: 9900 },
//   credits: {
//     totalRemaining: 85,
//     currentPeriodStart: '2026-03-01T00:00:00Z',
//     currentPeriodEnd: '2026-03-31T23:59:59Z',
//     allocated: 100,
//     consumed: 15
//   },
//   subscription: {
//     status: 'ACTIVE',
//     cancelAtPeriodEnd: false
//   }
// }
```

### 消耗积分

```typescript
import { consumeCredits } from '@/lib/stripe/billing'

// API 调用时扣除积分
const result = await consumeCredits({
  userId: 'user_123',
  featureType: 'ai_search',
  quantity: 10,
  creditsPerUnit: 1,
  metadata: {
    query: 'B2B SaaS companies in China',
    timestamp: new Date().toISOString()
  }
})

console.log(result)
// { success: true, consumed: 10, balance: 90 }
```

---

## 下一步 (Phase 2)

- [ ] 集成积分消耗到 AI 搜索功能
- [ ] 集成积分消耗到意图检测功能
- [ ] 集成积分消耗到 Webhook 导出功能
- [ ] 积分不足时的优雅降级处理
- [ ] 使用量记录持久化

---

## 故障排查

### 问题：Webhook 签名验证失败

**解决方案**：
1. 确认 `STRIPE_WEBHOOK_SECRET` 环境变量正确
2. 本地开发时使用 `stripe listen` 输出的 secret，不是 Dashboard 的
3. 生产环境使用 Dashboard 创建的 Webhook 的 secret

### 问题：找不到套餐定义

**解决方案**：
1. 运行 `npm run db:seed` 创建套餐
2. 检查 `plan_definitions` 表的 `stripe_price_id` 是否正确
3. 确认 Stripe 中的 Price ID 与数据库中的一致

### 问题：积分未发放

**解决方案**：
1. 检查 Webhook 日志，确认 `customer.subscription.created` 事件已处理
2. 检查 `credit_allocation_periods` 表是否有记录
3. 检查 `credit_ledger` 表是否有 `MONTHLY_ALLOCATION` 类型的记录

---

## 安全注意事项

1. **Webhook 端点不需要 auth**，因为 Stripe 使用签名验证
2. **所有 API 路由都需要验证用户登录**（使用 `auth()` 函数）
3. **敏感操作使用数据库事务**保证原子性
4. **Webhook 处理实现幂等性**防止重复发放积分
5. **Stripe 密钥不要提交到 Git**（已添加到 `.gitignore`）

---

## 参考资料

- [Stripe Billing 文档](https://stripe.com/docs/billing)
- [Stripe Checkout 文档](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks 文档](https://stripe.com/docs/webhooks)
- [Prisma 文档](https://www.prisma.io/docs)
