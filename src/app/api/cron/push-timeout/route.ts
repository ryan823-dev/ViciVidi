/**
 * Cron: 推送超时检查
 *
 * 每小时执行一次，将 status=PENDING 且已过 timeoutAt 的 PushRecord 标记为 TIMEOUT。
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const result = await prisma.pushRecord.updateMany({
      where: {
        status: "PENDING",
        timeoutAt: { lt: now },
      },
      data: { status: "TIMEOUT" },
    });

    console.log(`[push-timeout] Marked ${result.count} records as TIMEOUT`);
    return NextResponse.json({ processed: result.count });
  } catch (error) {
    console.error("[push-timeout] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
