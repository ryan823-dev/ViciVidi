# Vercel 环境变量配置指南

## 🎯 配置步骤

### 步骤 1: 访问 Vercel Dashboard
访问：https://vercel.com/dashboard

### 步骤 2: 选择你的 ViciVidi 项目

### 步骤 3: 进入环境变量设置
点击 **Settings** → **Environment Variables**

### 步骤 4: 添加环境变量

从 `.env.local` 文件中复制以下变量到 Vercel：

| 变量名 | 环境 |
|--------|------|
| `STRIPE_SECRET_KEY` | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Development, Preview, Production |
| `STRIPE_WEBHOOK_SECRET` | Production |
| `NEXT_PUBLIC_APP_URL` | Development, Preview, Production |
| `DATABASE_URL` | Production |
| `DIRECT_URL` | Production |
| `NEXTAUTH_SECRET` | Production |
| `NEXTAUTH_URL` | Development, Preview, Production |

**注意**: 
- Stripe 相关变量从 `.env.local` 复制
- `DATABASE_URL` 和 `DIRECT_URL` 从 Supabase 获取
- `NEXTAUTH_SECRET` 运行 `openssl rand -base64 32` 生成

### 步骤 5: 重新部署

配置完成后：
1. 进入 **Deployments** 标签页
2. 找到最新部署
3. 点击 **⋮** → **Redeploy**
4. 勾选 **Use existing Build Cache**
5. 点击 **Redeploy**

---

## 📝 获取 Supabase 数据库连接字符串

1. 访问：https://app.supabase.com/
2. 选择你的项目
3. 点击 **Settings** → **Database**
4. 复制 **Connection string** (DATABASE_URL)
5. 点击 **Direct connection** 标签复制 (DIRECT_URL)

---

## ✅ 验证配置

部署完成后访问：
- https://vicividi.com
- https://vicividi.com/pricing

检查页面是否正常加载。

---

**配置完成时间**: 待填写  
**配置状态**: 🟡 准备配置
