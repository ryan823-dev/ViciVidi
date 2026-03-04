/**
 * Supabase Publisher Adapter
 * 
 * 将 Vertax 内容推送到基于 Supabase 的客户独立站。
 * 目标端点：paintcell/supabase/functions/receive-content-push
 * 
 * 该 Edge Function 已部署在 Paintcell Supabase 项目上，支持：
 * - Bearer token 验证 (VERTAX_PUSH_SECRET)
 * - vertax_asset_id 幂等去重 (UPSERT)
 * - 双语字段 (title/title_zh, body/body_zh 等)
 * - 返回 { success, id, slug }
 */

import type { ContentPushPayload, PublishResult, PublisherAdapter } from "./types";

interface SupabasePublisherConfig {
  /** Supabase 项目 URL, e.g. "https://xxx.supabase.co" */
  supabaseUrl: string;
  /** Edge Function 名称, e.g. "receive-content-push" */
  functionName: string;
  /** 共享密钥，与 VERTAX_PUSH_SECRET 对应 */
  pushSecret: string;
}

export class SupabasePublisherAdapter implements PublisherAdapter {
  private config: SupabasePublisherConfig;

  constructor(config: SupabasePublisherConfig) {
    this.config = config;
  }

  /**
   * 构建 Edge Function 的完整 URL
   */
  private get functionUrl(): string {
    const base = this.config.supabaseUrl.replace(/\/$/, "");
    return `${base}/functions/v1/${this.config.functionName}`;
  }

  /**
   * 推送内容到 Supabase Edge Function
   */
  async publish(payload: ContentPushPayload): Promise<PublishResult> {
    try {
      const response = await fetch(this.functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.pushSecret}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        remoteId: data.id,
        remoteSlug: data.slug,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }
}

/**
 * 从 WebsiteConfig 创建 PublisherAdapter
 */
export function createPublisherAdapter(config: {
  siteType: string;
  supabaseUrl: string | null;
  functionName: string | null;
  pushSecret: string | null;
}): PublisherAdapter {
  if (config.siteType !== "supabase") {
    throw new Error(`Unsupported site type: ${config.siteType}. Currently only 'supabase' is supported.`);
  }

  if (!config.supabaseUrl || !config.functionName || !config.pushSecret) {
    throw new Error("Missing Supabase configuration: supabaseUrl, functionName, and pushSecret are required.");
  }

  return new SupabasePublisherAdapter({
    supabaseUrl: config.supabaseUrl,
    functionName: config.functionName,
    pushSecret: config.pushSecret,
  });
}
