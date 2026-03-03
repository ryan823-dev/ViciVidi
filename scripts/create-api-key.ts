import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { randomBytes } from "crypto";
import "dotenv/config";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });

  // 查找涂豆租户
  let tenant = await db.tenant.findFirst({
    where: { slug: "tudou" }
  });

  // 如果不存在则创建
  if (!tenant) {
    tenant = await db.tenant.create({
      data: {
        name: "涂豆科技",
        slug: "tudou",
        plan: "pro",
        status: "active",
      }
    });
    console.log("Created tenant:", tenant.name);
  } else {
    console.log("Found existing tenant:", tenant.name);
  }

  // 生成 API Key
  const apiKeyValue = `vtx_${randomBytes(32).toString("hex")}`;

  // 创建或更新 API Key
  const existingKey = await db.apiKey.findFirst({
    where: {
      tenantId: tenant.id,
      name: "knowledge-engine",
    }
  });

  if (existingKey) {
    console.log("API Key already exists:", existingKey.key);
  } else {
    const apiKey = await db.apiKey.create({
      data: {
        tenantId: tenant.id,
        name: "knowledge-engine",
        key: apiKeyValue,
        permissions: ["assets:write", "assets:read"],
        isActive: true,
      }
    });
    console.log("\n=== API Key Created ===");
    console.log("Tenant:", tenant.name);
    console.log("Key:", apiKey.key);
    console.log("\nUse this key in VertaX .env:");
    console.log(`ASSET_HUB_API_KEY=${apiKey.key}`);
    console.log(`ASSET_HUB_URL=http://localhost:3000`);
  }

  await db.$disconnect();
  await pool.end();
}

main().catch(console.error);
