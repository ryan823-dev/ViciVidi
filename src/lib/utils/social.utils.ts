import { PLATFORM_CONFIG } from "@/lib/constants";

export function validateContentLength(content: string, platform: string): {
  valid: boolean;
  length: number;
  limit: number;
} {
  const config = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG];
  const limit = config?.charLimit || 2000;
  return {
    valid: content.length <= limit,
    length: content.length,
    limit,
  };
}

export function getPlatformCharLimit(platform: string): number {
  const config = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG];
  return config?.charLimit || 2000;
}

export function getPlatformName(platform: string): string {
  const config = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG];
  return config?.name || platform;
}

export function formatPublishError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown publishing error occurred";
}
