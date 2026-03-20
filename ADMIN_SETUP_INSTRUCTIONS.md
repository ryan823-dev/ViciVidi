# 运营后台设置说明

## ✅ 已完成的步骤

1. ✅ 代码已推送到 GitHub
2. ✅ Vercel 会自动部署（等待 2-3 分钟）

## 📋 需要你完成的最后一步

### 在 Supabase 后台执行 SQL

1. **打开这个链接**：
   https://app.supabase.com/project/_/sql

2. **复制以下 SQL 代码**：
```sql
-- 第一步：检查当前数据库中有哪些表
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- 第二步：检查 users 表的结构（确认是否有 role 字段）
-- 运行上面的查询后，看看有没有 "users" 表

-- 第三步：添加 role 字段（如果 users 表存在）
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user';

-- 第四步：设置管理员权限（使用您的邮箱）
UPDATE "public"."users" SET role = 'admin' WHERE email = 'congrenmao799@gmail.com';

-- 第五步：验证设置结果
SELECT id, email, role, name, created_at FROM "public"."users" WHERE email = 'congrenmao799@gmail.com';
```

3. **点击 "Run" 按钮**（蓝色按钮）

4. **如果看到结果中有 `role: admin`，说明成功！**

## 🎉 完成！

执行完 SQL 后，访问：https://vicividi.com/admin

你应该能看到运营后台界面了！

---

**如果有任何问题，请告诉我你看到的错误信息。**
