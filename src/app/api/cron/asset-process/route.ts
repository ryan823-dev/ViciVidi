import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { processAssetTaskDirectly } from "@/lib/asset-processor";

export const maxDuration = 300; // 5 minutes per batch

/**
 * Asset Processing Background Worker
 *
 * 后台处理资产文本提取和分块任务
 * 由 Cron 定时调用：每分钟执行一次
 * 也可被 server action 直接调用
 */
export async function POST(req: NextRequest) {
  // Auth check for cron (using header token or API key)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || "dev-secret"}`) {
    // For development, allow without auth
    console.warn("[asset-process] Missing or invalid auth header, proceeding in dev mode");
  }

  try {
    // Find pending tasks
    const tasks = await db.assetProcessQueue.findMany({
      where: {
        status: { in: ["pending", "extracting", "chunking"] },
      },
      orderBy: [
        { createdAt: "asc" }, // Process oldest first
      ],
      take: 5, // Process up to 5 assets per run
    });

    if (tasks.length === 0) {
      return new Response(JSON.stringify({
        message: "No pending asset processing tasks",
        processed: 0,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    let totalProcessed = 0;
    const results: Array<{ taskId: string; status: string; error?: string }> = [];

    for (const task of tasks) {
      const result = await processAssetTaskDirectly(task.id);
      results.push({
        taskId: result.taskId,
        status: result.success ? "completed" : "failed",
        error: result.error,
      });
      if (result.success) {
        totalProcessed++;
      }
    }

    return new Response(JSON.stringify({
      message: `Processed ${totalProcessed} assets`,
      tasks: results,
      totalProcessed,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[asset-process] Critical error:", err);
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : "Critical error"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
