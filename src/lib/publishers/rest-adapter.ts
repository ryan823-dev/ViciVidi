/**
 * REST Publisher Adapter — 通用自定义 REST endpoint
 *
 * 适用场景：客户站有自定义的内容接收 API，格式不一定符合 Vertax 约定。
 * 直接将 ContentPushPayload 序列化后 POST 到配置的 endpoint。
 * 认证方式：Bearer token 或自定义 headers。
 */

import type { ContentPushPayload, PublishResult, PublisherAdapter } from "./types";

interface RestAdapterConfig {
  /** 目标 endpoint URL */
  endpointUrl: string;
  /** Bearer token（作为 Authorization: Bearer {token} 发送） */
  pushSecret?: string;
  /** 完全自定义的请求头（会覆盖默认 headers） */
  customHeaders?: Record<string, string>;
  /** 超时毫秒，默认 10000 */
  timeoutMs?: number;
}

export class RestPublisherAdapter implements PublisherAdapter {
  private config: RestAdapterConfig;

  constructor(config: RestAdapterConfig) {
    this.config = config;
  }

  async publish(payload: ContentPushPayload): Promise<PublishResult> {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs ?? 10000
    );

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(this.config.pushSecret
        ? { Authorization: `Bearer ${this.config.pushSecret}` }
        : {}),
      ...this.config.customHeaders,
    };

    try {
      const res = await fetch(this.config.endpointUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
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
