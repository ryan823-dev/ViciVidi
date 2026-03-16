# ⚡ ViciVidi AI 快速部署指南

**目标**: 15 分钟完成所有部署配置

---

## ✅ 已完成（代码已就绪）

- ✅ Stripe 产品创建（7 个）
- ✅ 代码推送到 GitHub
- ✅ Vercel 配置文件提交
- ✅ 数据库 SQL 脚本生成
- ✅ 测试工具准备就绪

---

## 🎯 剩余任务（15 分钟）

### 任务 1: 配置 Vercel 环境变量（5 分钟）

**访问**: https://vercel.com/dashboard

从 `.env.local` 文件复制以下变量值到 Vercel：
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `DATABASE_URL` (从 Supabase 获取)
- `DIRECT_URL` (从 Supabase 获取)
- `NEXTAUTH_SECRET` (运行 `openssl rand -base64 32` 生成)
- `NEXTAUTH_URL`

保存后重新部署。

---

### 任务 2: 配置 Stripe Webhook（3 分钟）

1. 访问：https://dashboard.stripe.com/webhooks
2. 切换到 **Production** 模式
3. 点击 **Add endpoint**
4. 配置：
   - **Endpoint URL**: `https://vicividi.com/api/billing/webhook`
   - **Events**: 勾选 6 个支付事件
5. 保存

---

### 任务 3: 更新数据库（5 分钟）

1. 访问：https://app.supabase.com/project/_/sql
2. 执行 `update-stripe-products.sql` 文件中的 SQL
3. 验证数据

---

## 📊 部署检查清单

- [ ] Vercel 环境变量配置完成
- [ ] Stripe Webhook Endpoint 配置完成
- [ ] 数据库 Product IDs 更新完成
- [ ] 网站正常访问
- [ ] Pricing 页面显示正确

---

**最后更新**: 2026-03-16  
**状态**: 🟡 等待配置
