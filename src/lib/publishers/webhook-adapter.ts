/**
 * Webhook Publisher Adapter — 适用于自研 Next.js / 任意 HTTP 服务
 *
 * 推送方式：POST {webhookUrl} + HMAC-SHA256 签名头
 * 客户侧接收示例 (Next.js App Router)：
 *
 *   // /api/vertax/receive/route.ts
 *   import { verifyVertaxSignature } from './verify';
 *   export async function POST(req: Request) {
 *     const body = await req.text();
 *     const sig = req.headers.get('x-vertax-signature');
 *     if (!verifyVertaxSignature(body, sig, process.env.VERTAX_PUSH_SECRET!)) {
 *       return Response.json({ error: 'Invalid signature' }, { status: 401 });
 *     }
 *     const payload = JSON.parse(body);
 *     // upsert to your DB by payload.vertax_asset_id ...
 *     return Response.json({ success: true, id: 'your-record-id', slug: payload.slug });
 *   }
 *
 * 签名算法：HMAC-SHA256(rawBody, pushSecret) → hex
 * 响应要求：{ success: true, id?: string, slug?: string }
 */

import crypto from "crypto";
import type { ContentPushPayload, PublishResult, PublisherAdapter } from "./types";

interface WebhookAdapterConfig {
  /** 客户站接收 endpoint，e.g. "https://example.com/api/vertax/receive" */
  webhookUrl: string;
  /** 共享密钥，用于生成 HMAC-SHA256 签名 */
  pushSecret: string;
  /** 额外自定义请求头（可选） */
  customHeaders?: Record<string, string>;
  /** 超时毫秒，默认 10000 */
  timeoutMs?: number;
}

export class WebhookPublisherAdapter implements PublisherAdapter {
  private config: WebhookAdapterConfig;

  constructor(config: WebhookAdapterConfig) {
    this.config = config;
  }

  private sign(body: string): string {
    return crypto
      .createHmac("sha256", this.config.pushSecret)
      .update(body)
      .digest("hex");
  }

  async publish(payload: ContentPushPayload): Promise<PublishResult> {
    const body = JSON.stringify(payload);
    const signature = this.sign(body);

    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs ?? 10000
    );

    try {
      const res = await fetch(this.config.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Vertax-Signature": signature,
          "X-Vertax-Asset-Id": payload.vertax_asset_id,
          ...this.config.customHeaders,
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timer);

      let data: Record<string, unknown> = {};
      try {
        data = await res.json();
      } catch {
        // non-JSON response
      }

      if (!res.ok) {
        return {
          success: false,
          error:
            (data.error as string) ||
            (data.message as string) ||
            `HTTP ${res.status}: ${res.statusText}`,
        };
      }

      return {
        success: true,
        remoteId: (data.id as string) ?? undefined,
        remoteSlug: (data.slug as string) ?? undefined,
        remoteUrl: (data.url as string) ?? undefined,
      };
    } catch (err) {
      clearTimeout(timer);
      const msg = err instanceof Error ? err.message : "Network error";
      return { success: false, error: msg };
    }
  }
}

/**
 * 客户侧签名验证工具（可直接复制到客户站使用）
 */
export function verifyVertaxSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}
