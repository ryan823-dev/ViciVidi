# ============================================
# ViciVidi AI - Stripe 配置完整指南
# ============================================

## 快速开始（5 分钟搞定）

### 步骤 1: 登录 Stripe

访问：https://dashboard.stripe.com/login

- 已有账户？直接登录
- 没有账户？点击"注册"（免费，只需邮箱）

---

### 步骤 2: 切换到测试模式

登录后，点击右上角的 **测试模式开关**（Test Mode）

✅ 确认显示为紫色背景，文字显示"测试模式"

---

### 步骤 3: 获取 API 密钥

**访问**: https://dashboard.stripe.com/test/apikeys

**操作**:
1. 找到"标准密钥"部分
2. 点击"Reveal test key"查看密钥
3. 复制以下两个密钥

```bash
# 复制这两个值
STRIPE_SECRET_KEY="sk_test_xxxxxxxxxxxxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxx"
```

---

### 步骤 4: 配置 Webhook

**访问**: https://dashboard.stripe.com/test/webhooks

**操作**:
1. 点击右上角"Add endpoint"
2. 填写以下信息：

```
Endpoint URL: http://localhost:3000/api/billing/webhook

Events to send:
  ✅ customer.subscription.created
  ✅ customer.subscription.updated
  ✅ customer.subscription.deleted
  ✅ invoice.paid
  ✅ invoice.payment_failed
  ✅ customer.updated
  ✅ checkout.session.completed
  ✅ payment_intent.succeeded
  ✅ payment_intent.payment_failed

API version: 使用默认最新版本（2025-02-24.acacia）
```

3. 点击"Add endpoint"创建

**获取 Webhook Secret**:
1. 创建成功后，点击刚创建的 endpoint
2. 找到"Signing secret"部分
3. 点击"Reveal"查看
4. 复制密钥：

```bash
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"
```

---

### 步骤 5: 更新 .env 文件

**复制 .env.stripe-example 为 .env.local**:

```bash
cp .env.stripe-example .env.local
```

**编辑 .env.local**，填入你的密钥：

```bash
# 替换这些占位符为你的真实密钥
STRIPE_SECRET_KEY="sk_test_你的真实密钥"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_你的真实密钥"
STRIPE_WEBHOOK_SECRET="whsec_你的真实密钥"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**⚠️ 重要**:
- ✅ 使用 `.env.local` 文件（不会被 Git 追踪）
- ❌ 不要修改 `.env.example`（这是模板）
- ❌ 不要提交真实密钥到 Git

---

### 步骤 6: 创建 Stripe 产品

**访问**: https://dashboard.stripe.com/test/products

**创建 3 个订阅产品**:

#### Product 1: Starter 套餐

```
点击 "Add product"

Name: ViciVidi AI - Starter
Description: 适合外贸新手与个人 SOHO
Pricing: 
  - Amount: $39 USD
  - Billing period: Monthly (recurring)

Metadata (可选):
  - monthlyCredits: 50
  - aiAnalysisQuota: 10

点击 "Save product"
```

**复制 Product ID**: `prod_xxxxxxxxxxxxx`

**创建价格**:
1. 点击刚创建的产品
2. 点击"Add price"
3. 选择"Recurring"
4. Amount: $39
5. 点击"Save"

**复制 Price ID**: `price_xxxxxxxxxxxxx`

---

#### Product 2: Growth 套餐（热门）

```
Name: ViciVidi AI - Growth
Description: 适合成长型外贸团队（热门）
Pricing: $79 USD/month (recurring)

Metadata:
  - monthlyCredits: 100
  - aiAnalysisQuota: 50
```

**复制 IDs**:
- Product ID: `prod_xxxxxxxxxxxxx`
- Price ID: `price_xxxxxxxxxxxxx`

---

#### Product 3: Pro 套餐

```
Name: ViciVidi AI - Pro
Description: 适合成熟外贸企业
Pricing: $139 USD/month (recurring)

Metadata:
  - monthlyCredits: 300
  - aiAnalysisQuota: 200
```

**复制 IDs**:
- Product ID: `prod_xxxxxxxxxxxxx`
- Price ID: `price_xxxxxxxxxxxxx`

---

### 步骤 7: 创建预充值产品（一次性付费）

**访问**: https://dashboard.stripe.com/test/products

**创建 4 个一次性产品**:

#### Product 4: Small Credits

```
Name: Small Credits
Description: 入门体验
Pricing: $49 USD (one-time)

Metadata:
  - credits: 500
  - unitPrice: 0.098
```

**复制 IDs**:
- Product ID: `prod_xxxxxxxxxxxxx`
- Price ID: `price_xxxxxxxxxxxxx`

---

#### Product 5: Medium Credits（主推）

```
Name: Medium Credits
Description: 最受欢迎（送 100 credits）
Pricing: $99 USD (one-time)

Metadata:
  - credits: 1200
  - unitPrice: 0.082
  - bonus: 100
```

---

#### Product 6: Large Credits

```
Name: Large Credits
Description: 超值特惠（送 300 credits）
Pricing: $199 USD (one-time)

Metadata:
  - credits: 3000
  - unitPrice: 0.066
  - bonus: 300
```

---

#### Product 7: Enterprise Credits

```
Name: Enterprise Credits
Description: 企业专享（送 2000 credits）
Pricing: $499 USD (one-time)

Metadata:
  - credits: 10000
  - unitPrice: 0.05
  - bonus: 2000
```

---

### 步骤 8: 更新数据库

**将所有 Product ID 和 Price ID 更新到数据库**:

```bash
# 1. 打开 Prisma Studio
npm run db:studio

# 2. 访问 http://localhost:5555

# 3. 找到 plan_definitions 表

# 4. 编辑每条记录，填入对应的 IDs:
# - Starter: stripeProductId = prod_xxx, stripePriceId = price_xxx
# - Growth: stripeProductId = prod_xxx, stripePriceId = price_xxx
# - Pro: stripeProductId = prod_xxx, stripePriceId = price_xxx
# - Small Credits: stripeProductId = prod_xxx, stripePriceId = price_xxx
# - Medium Credits: stripeProductId = prod_xxx, stripePriceId = price_xxx
# - Large Credits: stripeProductId = prod_xxx, stripePriceId = price_xxx
# - Enterprise Credits: stripeProductId = prod_xxx, stripePriceId = price_xxx

# 5. 点击 "Save changes"
```

---

### 步骤 9: 测试配置

**运行开发服务器**:

```bash
npm run dev
```

**测试订阅流程**:
1. 访问：http://localhost:3000/billing
2. 点击任意套餐的"订阅"按钮
3. 完成 Stripe Checkout（使用测试卡）
4. 检查数据库是否有订阅记录

**测试卡信息**:
```
卡号：4242 4242 4242 4242
过期：任意未来日期（如 12/30）
CVC: 任意 3 位（如 123）
ZIP: 任意 5 位（如 12345）
```

---

## 🎉 配置完成！

现在你的 Stripe 已经完全配置好了！

**下一步**:
1. ✅ 测试订阅流程
2. ✅ 测试积分消耗
3. ✅ 准备创始会员计划

---

## 📞 遇到问题？

### 常见问题

**Q: Webhook 不工作？**
A: 确保本地服务器运行在 http://localhost:3000，并且 Webhook endpoint 配置正确

**Q: 测试卡被拒绝？**
A: 确保在测试模式下，使用正确的测试卡号 4242 4242 4242 4242

**Q: 找不到 Product ID？**
A: 访问 https://dashboard.stripe.com/test/products，点击产品即可查看 ID

**Q: 密钥无效？**
A: 确保复制的是测试密钥（sk_test_开头），不是生产密钥（sk_live_开头）

---

## 🔐 安全提醒

- ✅ 使用 `.env.local` 存储密钥（不会被 Git 追踪）
- ✅ 定期轮换密钥
- ✅ 不要分享密钥给他人
- ✅ 生产环境使用不同的密钥

---

**祝你配置顺利！🚀**
