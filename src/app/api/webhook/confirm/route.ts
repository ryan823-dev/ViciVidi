/**
 * Webhook: 推送确认回调
 *
 * 客户站内容成功发布后调用此接口，将 PushRecord 从 PENDING 改为 CONFIRMED。
 *
 * POST /api/webhook/confirm
 * Header: X-Vertax-Signature: <HMAC-SHA256(body, pushSecret)>
 * Body: { "pushRecordId": "...", "remoteId"?: "...", "remoteSlug"?: "...", "remoteUrl"?: "..." }
 *
 * 幂等：已 CONFIRMED 的记录直接返回 200。
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-vertax-signature");

  let body: { pushRecordId?: string; remoteId?: string; remoteSlug?: string; remoteUrl?: string };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.pushRecordId) {
    return NextResponse.json({ error: "pushRecordId is required" }, { status: 400 });
  }

  // 查 PushRecord → 找到对应 WebsiteConfig 的 pushSecret
  const record = await prisma.pushRecord.findUnique({
    where: { id: body.pushRecordId },
    include: {
      websiteConfig: {
        select: { pushSecret: true },
      },
    },
  });

  if (!record) {
    return NextResponse.json({ error: "PushRecord not found" }, { status: 404 });
  }

  // 签名验证（pushSecret 存在时必须验证）
  const secret = record.websiteConfig?.pushSecret ?? "";
  if (secret && !verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 幂等：已 CONFIRMED 直接返回
  if (record.status === "CONFIRMED") {
    return NextResponse.json({ ok: true, status: "CONFIRMED", alreadyConfirmed: true });
  }

  // 更新为 CONFIRMED
  const updateData: Record<string, unknown> = {
    status: "CONFIRMED",
    confirmedAt: new Date(),
  };
  if (body.remoteId) updateData.remoteId = body.remoteId;
  if (body.remoteSlug) updateData.remoteSlug = body.remoteSlug;
  if (body.remoteUrl) updateData.targetUrl = body.remoteUrl;

  await prisma.pushRecord.update({
    where: { id: body.pushRecordId },
    data: updateData,
  });

  return NextResponse.json({ ok: true, status: "CONFIRMED" });
}
