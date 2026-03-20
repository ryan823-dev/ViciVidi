# ViciVidi 运营后台使用指南

## 📋 概述

ViciVidi 运营后台是专为内部运营团队设计的管理系统，用于管理所有用户、查看全局数据、配置系统参数。

## 🎯 核心功能

### 1. 用户管理 (`/admin`)
- 查看所有注册用户
- 搜索用户（邮箱/姓名）
- 修改用户权限（普通用户 ↔ 管理员）
- 禁用/启用用户账号
- 查看用户注册时间和最后登录时间

### 2. 公司管理 (`/admin/companies`)
- 查看平台所有公司数据
- 搜索公司（公司名/域名）
- 查看公司详细信息
- 查看公司所有者
- 统计公司增长趋势

### 3. 数据分析 (`/admin/analytics`)
- 用户增长趋势图
- 套餐分布饼图
- API 使用量统计
- 收入统计
- 线索数量统计

### 4. API 密钥管理 (`/admin/api-keys`)
- 创建新的 API 密钥
- 设置密钥权限
- 查看密钥使用记录
- 启用/停用密钥
- 删除密钥

### 5. 系统设置 (`/admin/settings`)
- 站点基本配置
- 用户注册设置
- 默认配额限制
- SMTP 邮件服务配置
- Stripe 支付配置

## 🔐 权限控制

### 管理员设置

1. **通过数据库设置管理员**

```sql
-- 找到管理员用户的 ID
SELECT id, email FROM users WHERE email = 'admin@vicividi.com';

-- 设置为管理员
UPDATE users SET role = 'admin' WHERE email = 'admin@vicividi.com';
```

2. **验证管理员权限**

```sql
-- 确认角色已更新
SELECT id, email, role FROM users WHERE email = 'admin@vicividi.com';
```

### 访问控制

- 只有 `role = 'admin'` 的用户可以访问 `/admin/*` 路由
- 非管理员访问会自动重定向到 `/dashboard`
- 未登录用户访问会重定向到 `/login`

## 🚀 部署步骤

### 1. 运行数据库迁移

```bash
cd ViciVidi
npx prisma migrate dev --name add_admin_role
```

### 2. 设置管理员账号

执行上面的 SQL 语句将你的账号设置为管理员。

### 3. 访问运营后台

登录管理员账号后访问：
```
https://vicividi.com/admin
```

## 📁 文件结构

```
src/
├── app/
│   └── (admin)/
│       └── admin/
│           ├── layout.tsx          # 管理后台布局（含权限检查）
│           ├── page.tsx            # 用户管理页面
│           ├── companies/
│           │   └── page.tsx        # 公司管理页面
│           ├── analytics/
│           │   └── page.tsx        # 数据分析页面
│           ├── api-keys/
│           │   └── page.tsx        # API 密钥管理页面
│           └── settings/
│               └── page.tsx        # 系统设置页面
├── components/
│   └── layout/
│       ├── admin-sidebar.tsx       # 管理后台侧边栏
│       └── admin-header.tsx        # 管理后台顶部栏
└── prisma/
    ├── schema.prisma               # 数据库模型（添加了 role 字段）
    └── migrations/
        └── 20260319000000_add_admin_role/
            └── migration.sql       # 管理员角色迁移
```

## 🔧 技术栈

- **框架**: Next.js 16 App Router
- **数据库**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **认证**: Supabase Auth
- **UI 组件**: shadcn/ui
- **图表**: Recharts
- **权限**: 基于角色的访问控制 (RBAC)

## 📝 注意事项

1. **安全第一**
   - API 密钥是敏感凭据，请妥善保管
   - 管理员账号应启用双因素认证
   - 定期审查管理员权限

2. **性能优化**
   - 用户列表支持分页加载（待实现）
   - 大数据量查询应添加索引
   - 考虑添加缓存机制

3. **待扩展功能**
   - 批量操作用户
   - 导出 CSV/Excel 报表
   - 审计日志记录
   - 自定义配额管理
   - 邮件群发功能

## 🐛 故障排查

### 问题：访问 `/admin` 被重定向到 `/dashboard`

**原因**: 当前用户不是管理员

**解决方案**:
```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 问题：页面显示"加载中..."

**原因**: API 调用失败或数据库连接问题

**解决方案**:
1. 检查 Supabase 连接是否正常
2. 查看浏览器控制台错误信息
3. 检查服务器日志

### 问题：图表不显示

**原因**: Recharts 库未正确加载

**解决方案**:
```bash
npm install recharts
```

## 📞 支持

如有问题，请查看：
- [项目 README](../README.md)
- [部署指南](../DEPLOYMENT_SUMMARY.md)
- [计费系统文档](./BILLING_SETUP.md)

---

**最后更新**: 2026-03-19  
**版本**: v1.0.0
