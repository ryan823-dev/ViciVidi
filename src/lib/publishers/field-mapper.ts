/**
 * 字段映射器：Vertax SeoContent → Paintcell ContentPushPayload
 * 
 * 将 Vertax 中的 SeoContent 记录转换为 Paintcell Edge Function 接受的格式。
 * Paintcell resources_posts 表为双语结构（_zh 后缀），需要判断内容语言。
 */

import type { ContentPushPayload, PaintcellResourceCategory } from "./types";
import { CONTENT_TYPE_CATEGORY_MAP } from "./types";

interface VertaxContent {
  id: string;
  title: string;
  slug: string;
  content: string;        // Markdown 正文
  excerpt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywords?: string[];
  featuredImage?: string | null;
  categorySlug?: string;  // ContentCategory.slug
  schemaJson?: unknown;
}

/**
 * 检测文本是否包含大量中文字符
 */
function isChinese(text: string): boolean {
  const chineseChars = text.match(/[\u4e00-\u9fff]/g);
  if (!chineseChars) return false;
  // 如果中文字符占比超过 30% 则认为是中文
  return chineseChars.length / text.length > 0.3;
}

/**
 * 生成 summary：取正文前 200 字符
 */
function generateSummary(body: string, maxLength = 200): string {
  // 去除 Markdown 标记
  const plain = body
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
  return plain.slice(0, maxLength);
}

/**
 * 确保 slug 合规（仅小写字母、数字、连字符）
 */
function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

/**
 * 将 Vertax SeoContent 转换为 Paintcell ContentPushPayload
 */
export function mapVertaxToPaintcell(
  content: VertaxContent,
  options?: {
    category?: PaintcellResourceCategory;
    status?: "review" | "published";
  }
): ContentPushPayload {
  const isZh = isChinese(content.title + content.content);

  // 确定 category
  const category =
    options?.category ||
    CONTENT_TYPE_CATEGORY_MAP[content.categorySlug || "default"] ||
    "learning-center";

  // 基础 payload（所有推送必填）
  const payload: ContentPushPayload = {
    vertax_asset_id: content.id,
    title: isZh ? (content.metaTitle || content.title) : content.title,
    slug: sanitizeSlug(content.slug),
    body: content.content,
    summary: content.excerpt || generateSummary(content.content),
    meta_title: content.metaTitle || content.title.slice(0, 60),
    meta_description: content.metaDescription || generateSummary(content.content, 160),
    category,
    featured_image_url: content.featuredImage || undefined,
    status: options?.status || "published",
  };

  // 如果是中文内容，同时填充 _zh 字段
  if (isZh) {
    payload.title_zh = content.title;
    payload.body_zh = content.content;
    payload.summary_zh = content.excerpt || generateSummary(content.content);
    payload.meta_title_zh = content.metaTitle || content.title.slice(0, 60);
    payload.meta_description_zh = content.metaDescription || generateSummary(content.content, 160);
  }

  return payload;
}
