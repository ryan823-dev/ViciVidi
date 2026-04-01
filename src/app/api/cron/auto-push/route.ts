/**
 * Cron: Auto-push
 * 每小时运行，扫描 status=published 但尚无成功 PushRecord 的内容，批量补推。
 * 防重：跳过已有 PENDING / CONFIRMED 状态 PushRecord 的内容。
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPublisherAdapter, mapVertaxToPaintcell } from "@/lib/publishers";
import type { PublisherAdapterConfig } from "@/lib/publishers";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 获取所有活跃 WebsiteConfig（支持多站）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const configs: any[] = await (prisma.websiteConfig as any).findMany({
    where: { isActive: true },
  });

  if (configs.length === 0) {
    return NextResponse.json({ pushed: 0, message: "No active website configs" });
  }

  const results: { tenantId: string; contentId: string; success: boolean; error?: string }[] = [];

  for (const config of configs) {
    // 找出该租户已发布但没有成功推送记录的内容
    const unpushed = await prisma.seoContent.findMany({
      where: {
        tenantId: config.tenantId,
        status: "published",
        deletedAt: null,
        pushRecords: {
          none: {
            websiteConfigId: config.id,
            status: { in: ["PENDING", "CONFIRMED"] },
          },
        },
      },
      include: { category: { select: { slug: true } } },
      take: 20, // 每次每站最多补推 20 条，防止超时
      orderBy: { publishedAt: "desc" },
    });

    if (unpushed.length === 0) continue;

    // 创建适配器
    let adapter;
    try {
      adapter = createPublisherAdapter({
        siteType: config.siteType,
        supabaseUrl: config.supabaseUrl,
        functionName: config.functionName,
        webhookUrl: config.webhookUrl ?? null,
        wpUrl: config.wpUrl ?? null,
        wpUsername: config.wpUsername ?? null,
        wpPassword: config.wpPassword ?? null,
        pushSecret: config.pushSecret,
        customHeaders: config.customHeaders as Record<string, string> | null,
      } as PublisherAdapterConfig);
    } catch (err) {
      console.error(`[auto-push] Cannot create adapter for tenant ${config.tenantId}:`, err);
      continue;
    }

    const now = new Date();
    const timeoutAt = new Date(now.getTime() + (config.approvalTimeoutHours ?? 24) * 3600000);

    for (const content of unpushed) {
      try {
        const payload = mapVertaxToPaintcell(
          {
            id: content.id,
            title: content.title,
            slug: content.slug,
            content: content.content,
            excerpt: content.excerpt,
            metaTitle: content.metaTitle,
            metaDescription: content.metaDescription,
            keywords: content.keywords,
            featuredImage: content.featuredImage,
            categorySlug: content.category?.slug ?? "article",
          },
          { status: "published" }
        );

        const result = await adapter.publish(payload);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const contentVersion: number | null = (content as any).version ?? null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma.pushRecord as any).upsert({
          where: { contentId_websiteConfigId: { contentId: content.id, websiteConfigId: config.id } },
          create: {
            tenantId: config.tenantId,
            contentId: content.id,
            websiteConfigId: config.id,
            status: result.success ? "PENDING" : "FAILED",
            remoteId: result.remoteId ?? null,
            remoteSlug: result.remoteSlug ?? null,
            targetUrl: result.remoteSlug
              ? `${config.url ?? ""}/en/resources/articles/${result.remoteSlug}`
              : null,
            pushPayload: JSON.parse(JSON.stringify(payload)),
            contentVersion,
            contentSnapshot: {
              title: content.title,
              slug: content.slug,
              excerpt: content.excerpt,
              keywords: content.keywords,
            },
            pushedAt: now,
            timeoutAt,
            retryCount: 0,
            lastError: result.error ?? null,
          },
          update: {
            status: result.success ? "PENDING" : "FAILED",
            remoteId: result.remoteId ?? null,
            remoteSlug: result.remoteSlug ?? null,
            pushPayload: JSON.parse(JSON.stringify(payload)),
            contentVersion,
            contentSnapshot: {
              title: content.title,
              slug: content.slug,
              excerpt: content.excerpt,
              keywords: content.keywords,
            },
            pushedAt: now,
            timeoutAt,
            retryCount: { increment: 1 },
            lastError: result.error ?? null,
          },
        });

        results.push({ tenantId: config.tenantId, contentId: content.id, success: result.success, error: result.error });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[auto-push] Error pushing ${content.id}:`, msg);
        results.push({ tenantId: config.tenantId, contentId: content.id, success: false, error: msg });
      }
    }
  }

  const pushed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return NextResponse.json({ pushed, failed, total: results.length, results });
}
