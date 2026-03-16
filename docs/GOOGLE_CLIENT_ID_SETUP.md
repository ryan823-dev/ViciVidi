# 🔑 Google OAuth Client ID 获取指南

## 步骤 1: 访问 Google Cloud Console

访问：https://console.cloud.google.com/apis/credentials

---

## 步骤 2: 创建项目（如果还没有）

1. 点击顶部的项目选择器
2. 点击 **新建项目**
3. 项目名称：`ViciVidi AI`
4. 点击 **创建**

---

## 步骤 3: 配置 OAuth 同意屏幕

1. 左侧菜单点击 **OAuth 同意屏幕**
2. 选择用户类型：**外部**
3. 点击 **创建**

### 填写应用信息：

| 字段 | 值 |
|------|-----|
| 应用名称 | `ViciVidi AI` |
| 用户支持电子邮件地址 | 你的邮箱 |
| 应用徽标 | （可选，暂时跳过） |
| 应用首页链接 | `https://vicividi.com` |
| 应用隐私权政策链接 | `https://vicividi.com/privacy` |
| 应用服务条款链接 | `https://vicividi.com/terms` |
| 已获授权的网域 | `vicividi.com` |
| 开发者联系信息 | 你的邮箱 |

4. 点击 **保存并继续**

### 配置作用域：

1. 点击 **添加或移除作用域**
2. 选择以下作用域：
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
3. 点击 **更新**
4. 点击 **保存并继续**

### 测试用户：

1. 点击 **添加用户**
2. 输入你的 Gmail 地址
3. 点击 **保存并继续**

---

## 步骤 4: 创建 OAuth 客户端 ID

1. 左侧菜单点击 **凭据**
2. 点击顶部的 **创建凭据**
3. 选择 **OAuth 客户端 ID**

### 配置 OAuth 客户端：

| 字段 | 值 |
|------|-----|
| 应用类型 | **Web 应用** |
| 名称 | `ViciVidi AI Web Client` |

### 已获授权的 JavaScript 来源：

点击 **添加 URI**，添加：

```
https://vicividi.com
https://bsptzrgehllgoghlkeqq.supabase.co
```

### 已获授权的重定向 URI：

点击 **添加 URI**，添加：

```
https://bsptzrgehllgoghlkeqq.supabase.co/auth/v1/callback
```

4. 点击 **创建**

---

## 步骤 5: 复制 Client ID 和 Client Secret

创建成功后，会显示：

- **您的客户端 ID**: `xxxxx.apps.googleusercontent.com`
- **您的客户端密钥**: `GOCSPX-xxxxx`

**立即复制这两个值！**

---

## 步骤 6: 在 Supabase 配置

1. 访问：https://app.supabase.com/project/bsptzrgehllgoghlkeqq/auth/providers
2. 找到 **Google**
3. 开启 **Enable Sign in with Google**
4. 填写：
   - **Client ID**: 粘贴你的客户端 ID
   - **Client Secret**: 粘贴你的客户端密钥
5. 点击 **Save**

---

## 📋 示例格式

### Client ID 格式：
```
123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
```

### Client Secret 格式：
```
GOCSPX-abcdefghijklmnopqrstuvwxyz123456
```

---

## ✅ 验证配置

配置完成后：

1. 访问：https://vicividi.com/login
2. 点击 **使用 Google 登录**
3. 应该能跳转到 Google 授权页面
4. 授权后成功登录

---

## 🔧 常见问题

### 问题 1: "Access blocked: App is waiting for verification"

**原因**: OAuth 应用还在测试模式

**解决**: 在 OAuth 同意屏幕添加测试用户（你的 Gmail）

### 问题 2: "Redirect URI mismatch"

**原因**: 重定向 URI 配置不正确

**解决**: 确保添加了完整的 URI：
```
https://bsptzrgehllgoghlkeqq.supabase.co/auth/v1/callback
```

### 问题 3: "Invalid Client"

**原因**: Client ID 或 Client Secret 错误

**解决**: 重新复制粘贴，确保没有多余空格

---

## 🔗 重要链接

- Google Cloud Console: https://console.cloud.google.com/apis/credentials
- Supabase Auth Providers: https://app.supabase.com/project/bsptzrgehllgoghlkeqq/auth/providers

---

**配置完成后告诉我 Client ID 和 Client Secret，我可以帮你验证配置！**