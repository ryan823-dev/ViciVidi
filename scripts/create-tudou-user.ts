import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });

  // 查找涂豆租户
  const tenant = await db.tenant.findFirst({
    where: { slug: "tudou" }
  });

  if (!tenant) {
    console.log("Tenant not found");
    await db.$disconnect();
    await pool.end();
    return;
  }

  console.log("Found tenant:", tenant.name, tenant.id);

  // 查找或创建角色
  let role = await db.role.findFirst({
    where: { name: "tenant_admin" }
  });

  if (!role) {
    role = await db.role.create({
      data: {
        name: "tenant_admin",
        displayName: "企业管理员",
        permissions: { all: true },
        isSystemRole: false,
      }
    });
    console.log("Created role:", role.name);
  }

  // 检查是否已有用户
  const existingUser = await db.user.findFirst({
    where: { tenantId: tenant.id }
  });

  if (existingUser) {
    console.log("Tenant already has user:", existingUser.email);
  } else {
    // 创建用户
    const hashedPassword = await bcrypt.hash("tudou123", 10);
    const user = await db.user.create({
      data: {
        email: "admin@tudou.com",
        name: "涂豆管理员",
        password: hashedPassword,
        tenantId: tenant.id,
        roleId: role.id,
      }
    });
    console.log("Created user:", user.email);
  }

  await db.$disconnect();
  await pool.end();
}

main().catch(console.error);
