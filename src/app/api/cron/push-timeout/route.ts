/**
 * Cron: 推送超时检查
 * 
 * 每 30 分钟执行一次，检查 PushRecord 中 status=PENDING 且已超时的记录，
 * 将其状态更新为 TIMEOUT。
 * 
 * 配置 vercel.json cron: every 30 minutes
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  // 验证 cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // 查询所有超时的 PENDING 记录
    const timeoutRecords = await db.pushRecord.findMany({
      where: {
        status: "PENDING",
        timeoutAt: { lt: now },
      },
      select: { id: true, contentId: true, tenantId: true },
    });

    if (timeoutRecords.length === 0) {
      return NextResponse.json({ processed: 0, message: "No timeout records" });
    }

    // 批量更新为 TIMEOUT
    const result = await db.pushRecord.updateMany({
      where: {
        id: { in: timeoutRecords.map((r) => r.id) },
      },
      data: {
        status: "TIMEOUT",
      },
    });

    console.log(`[push-timeout] Marked ${result.count} records as TIMEOUT`);

    return NextResponse.json({
      processed: result.count,
      records: timeoutRecords.map((r) => r.id),
    });
  } catch (error) {
    console.error("[push-timeout] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
