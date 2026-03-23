/**
 * 统一缓存层
 * 提供通用的缓存接口，支持内存缓存和 Redis 扩展
 */

export interface CacheOptions {
  /** 缓存过期时间（秒） */
  ttl?: number;
  /** 是否启用缓存 */
  enabled?: boolean;
  /** 缓存前缀 */
  prefix?: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

// 默认配置
const DEFAULT_TTL = 300; // 5分钟
const DEFAULT_PREFIX = 'vertax:';

// 内存缓存存储
const memoryStore = new Map<string, { value: unknown; expiresAt: number }>();

// 统计信息
let stats = { hits: 0, misses: 0 };

/**
 * 获取缓存值
 */
export function getCache<T>(key: string): T | null {
  const fullKey = `${DEFAULT_PREFIX}${key}`;
  const entry = memoryStore.get(fullKey);

  if (!entry) {
    stats.misses++;
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(fullKey);
    stats.misses++;
    return null;
  }

  stats.hits++;
  return entry.value as T;
}

/**
 * 设置缓存值
 */
export function setCache<T>(key: string, value: T, options: CacheOptions = {}): void {
  const fullKey = `${DEFAULT_PREFIX}${key}`;
  const ttl = options.ttl ?? DEFAULT_TTL;

  memoryStore.set(fullKey, {
    value,
    expiresAt: Date.now() + ttl * 1000,
  });
}

/**
 * 删除缓存
 */
export function deleteCache(key: string): boolean {
  const fullKey = `${DEFAULT_PREFIX}${key}`;
  return memoryStore.delete(fullKey);
}

/**
 * 清除所有缓存
 */
export function clearCache(): void {
  memoryStore.clear();
  stats = { hits: 0, misses: 0 };
}

/**
 * 获取缓存统计
 */
export function getCacheStats(): CacheStats {
  const total = stats.hits + stats.misses;
  return {
    hits: stats.hits,
    misses: stats.misses,
    size: memoryStore.size,
    hitRate: total > 0 ? stats.hits / total : 0,
  };
}

/**
 * 清理过期缓存
 */
export function cleanupExpiredCache(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of memoryStore) {
    if (now > entry.expiresAt) {
      memoryStore.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * 带缓存的函数调用包装器
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  if (options.enabled === false) {
    return fetcher();
  }

  const cached = getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  const value = await fetcher();
  setCache(key, value, options);
  return value;
}

/**
 * 生成缓存键
 */
export function makeCacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(Boolean).join(':');
}

// 定期清理过期缓存（每5分钟）
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredCache, 5 * 60 * 1000);
}
