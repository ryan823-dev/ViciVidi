# 🔧 Google 登录配置指南

## 问题原因
Supabase 需要在 Dashboard 中启用 Google OAuth Provider 才能使用 Google 登录。

---

## 配置步骤

### 步骤 1: 获取 Google OAuth 凭证

1. 访问 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. 创建项目或选择现有项目
3. 点击 **创建凭据** → **OAuth 客户端 ID**
4. 应用类型选择 **Web 应用**
5. 添加授权重定向 URI：
   ```
   https://bsptzrgehllgoghlkeqq.supabase.co/auth/v1/callback
   ```
6. 复制 **客户端 ID** 和 **客户端密钥**

---

### 步骤 2: 在 Supabase 配置 Google OAuth

1. 访问 [Supabase Dashboard](https://app.supabase.com/)
2. 选择你的项目（bsptzrgehllgoghlkeqq）
3. 点击左侧 **Authentication** → **Providers**
4. 找到 **Google** 并点击
5. 启用 Google Provider
6. 填写：
   - **Client ID**: 你的 Google OAuth 客户端 ID
   - **Client Secret**: 你的 Google OAuth 客户端密钥
7. 点击 **Save**

---

### 步骤 3: 配置 Site URL

1. 在 Supabase Dashboard，点击 **Authentication** → **URL Configuration**
2. 设置 **Site URL**:
   ```
   https://vicividi.com
   ```
3. 添加 **Redirect URLs**:
   ```
   https://vicividi.com/auth/callback
   ```
4. 点击 **Save**

---

## ✅ 验证配置

配置完成后：
1. 访问 https://vicividi.com/login
2. 点击 **使用 Google 登录**
3. 应该能正常跳转到 Google 授权页面

---

## 🔧 已完成配置

✅ `.env.local` 已添加 Supabase 配置
✅ Vercel 环境变量已更新
✅ Middleware 认证逻辑正常

---

## 待完成

⏳ 在 Supabase Dashboard 配置 Google OAuth Provider