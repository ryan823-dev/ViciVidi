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
-- 添加管理员角色字段
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user';

-- 创建索引
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");

-- 设置你为管理员（这会自动识别当前登录的用户）
UPDATE "users" SET role = 'admin' WHERE id = auth.uid();

-- 验证是否成功
SELECT id, email, role FROM "users" ORDER BY created_at DESC LIMIT 1;
```

3. **点击 "Run" 按钮**（蓝色按钮）

4. **如果看到结果中有 `role: admin`，说明成功！**

## 🎉 完成！

执行完 SQL 后，访问：https://vicividi.com/admin

你应该能看到运营后台界面了！

---

**如果有任何问题，请告诉我你看到的错误信息。**
