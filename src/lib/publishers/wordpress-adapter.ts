/**
 * WordPress Publisher Adapter
 *
 * 通过 WordPress REST API v2 推送内容。
 * 认证方式：Application Password（WordPress 5.6+）或 Basic Auth（需插件）。
 *
 * 目标端点：POST /wp-json/wp/v2/posts
 */

import type { ContentPushPayload, PublishResult, PublisherAdapter } from "./types";

export interface WordPressAdapterConfig {
  /** WordPress 站点根 URL，e.g. "https://example.com" */
  siteUrl: string;
  /** WordPress 用户名 */
  username: string;
  /** Application Password（格式：xxxx xxxx xxxx xxxx xxxx xxxx）或普通密码 */
  password: string;
  /** 默认文章状态，默认 publish */
  defaultStatus?: "publish" | "draft" | "pending";
  /** 默认分类 ID 数组 */
  defaultCategories?: number[];
}

export class WordPressPublisherAdapter implements PublisherAdapter {
  private config: WordPressAdapterConfig;

  constructor(config: WordPressAdapterConfig) {
    this.config = config;
  }

  private get apiBase(): string {
    return `${this.config.siteUrl.replace(/\/$/, "")}/wp-json/wp/v2`;
  }

  private get authHeader(): string {
    const credentials = `${this.config.username}:${this.config.password}`;
    return `Basic ${Buffer.from(credentials).toString("base64")}`;
  }

  async publish(payload: ContentPushPayload): Promise<PublishResult> {
    // Map ContentPushPayload → WordPress post body
    const wpPost = {
      title: payload.title,
      slug: payload.slug,
      content: payload.body,
      excerpt: payload.summary ?? "",
      status: this.config.defaultStatus ?? "publish",
      categories: this.config.defaultCategories ?? [],
      meta: {
        _yoast_wpseo_title: payload.meta_title ?? payload.title,
        _yoast_wpseo_metadesc: payload.meta_description ?? "",
        vertax_asset_id: payload.vertax_asset_id,
        // Bilingual (ACF/custom meta)
        title_zh: payload.title_zh ?? "",
        content_zh: payload.body_zh ?? "",
      },
    };

    try {
      // Check if post already exists via vertax_asset_id custom meta
      const searchUrl = `${this.apiBase}/posts?meta_key=vertax_asset_id&meta_value=${encodeURIComponent(payload.vertax_asset_id)}&per_page=1`;
      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: this.authHeader },
      });

      let existingPostId: number | null = null;
      if (searchRes.ok) {
        const existing = await searchRes.json();
        if (Array.isArray(existing) && existing.length > 0) {
          existingPostId = existing[0].id;
        }
      }

      // Create or update
      const url = existingPostId
        ? `${this.apiBase}/posts/${existingPostId}`
        : `${this.apiBase}/posts`;
      const method = existingPostId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: this.authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(wpPost),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          error: data.message || `WordPress API error: ${res.status}`,
        };
      }

      return {
        success: true,
        remoteId: String(data.id),
        remoteSlug: data.slug,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Network error",
      };
    }
  }
}
