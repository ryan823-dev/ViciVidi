import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });

  const users = await db.user.findMany({ select: { email: true, name: true, password: true } });
  console.log('Users in DB:');
  users.forEach(u => console.log(`  - ${u.email} (${u.name}) hasPassword: ${!!u.password}`));
  
  await db.$disconnect();
  await pool.end();
}

main().catch(console.error);
