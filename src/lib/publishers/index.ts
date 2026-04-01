/**
 * Content Publishing Pipeline - Barrel Export
 */

export { SupabasePublisherAdapter, createPublisherAdapter } from "./supabase-adapter";
export { WebhookPublisherAdapter, verifyVertaxSignature } from "./webhook-adapter";
export { RestPublisherAdapter } from "./rest-adapter";
export { WordPressPublisherAdapter } from "./wordpress-adapter";
export { mapVertaxToPaintcell } from "./field-mapper";
export type {
  ContentPushPayload,
  PublishResult,
  PublisherAdapter,
  PublisherAdapterConfig,
  SiteType,
  // backward compat
  PaintcellResourceCategory,
  PaintcellContentStatus,
} from "./types";
export { CONTENT_TYPE_CATEGORY_MAP } from "./types";
