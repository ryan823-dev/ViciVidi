import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getCache,
  setCache,
  deleteCache,
  clearCache,
  getCacheStats,
  cleanupExpiredCache,
  withCache,
  makeCacheKey,
} from '../lib/cache';

describe('Cache Module', () => {
  beforeEach(() => {
    clearCache();
  });

  afterEach(() => {
    clearCache();
  });

  describe('setCache & getCache', () => {
    it('should store and retrieve a value', () => {
      setCache('test:key', { name: 'test' });
      const result = getCache<{ name: string }>('test:key');
      expect(result).toEqual({ name: 'test' });
    });

    it('should return null for non-existent key', () => {
      const result = getCache('nonexistent');
      expect(result).toBeNull();
    });

    it('should override existing value', () => {
      setCache('test:key', 'first');
      setCache('test:key', 'second');
      const result = getCache<string>('test:key');
      expect(result).toBe('second');
    });

    it('should support number values', () => {
      setCache('count', 42);
      expect(getCache<number>('count')).toBe(42);
    });

    it('should support array values', () => {
      const arr = [1, 2, 3];
      setCache('array', arr);
      expect(getCache<number[]>('array')).toEqual(arr);
    });
  });

  describe('deleteCache', () => {
    it('should delete existing key', () => {
      setCache('test:key', 'value');
      expect(deleteCache('test:key')).toBe(true);
      expect(getCache('test:key')).toBeNull();
    });

    it('should return false for non-existent key', () => {
      expect(deleteCache('nonexistent')).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached values', () => {
      setCache('key1', 'value1');
      setCache('key2', 'value2');
      clearCache();
      expect(getCache('key1')).toBeNull();
      expect(getCache('key2')).toBeNull();
    });

    it('should reset stats', () => {
      setCache('key', 'value');
      getCache('key'); // hit
      getCache('nonexistent'); // miss
      clearCache();
      const stats = getCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('TTL', () => {
    it('should expire after TTL', async () => {
      setCache('temp', 'value', { ttl: 1 }); // 1 second
      expect(getCache('temp')).toBe('value');

      // Wait for expiration
      await new Promise((r) => setTimeout(r, 1100));
      expect(getCache('temp')).toBeNull();
    });

    it('should use default TTL of 5 minutes', () => {
      setCache('test', 'value');
      const result = getCache<string>('test');
      expect(result).toBe('value');
    });
  });

  describe('getCacheStats', () => {
    it('should track hits and misses', () => {
      setCache('key1', 'value1');
      getCache('key1'); // hit
      getCache('key1'); // hit
      getCache('nonexistent'); // miss

      const stats = getCacheStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });

    it('should calculate hit rate', () => {
      getCache('nonexistent'); // miss
      getCache('nonexistent'); // miss
      getCache('nonexistent'); // miss
      getCache('nonexistent'); // miss
      // 0 hits, 4 misses = 0% hit rate

      const stats = getCacheStats();
      expect(stats.hitRate).toBe(0);
    });

    it('should track size', () => {
      setCache('key1', 'value1');
      setCache('key2', 'value2');
      const stats = getCacheStats();
      expect(stats.size).toBe(2);
    });
  });

  describe('cleanupExpiredCache', () => {
    it('should remove expired entries', async () => {
      setCache('temp', 'value', { ttl: 1 });
      setCache('permanent', 'value');

      await new Promise((r) => setTimeout(r, 1100));

      const cleaned = cleanupExpiredCache();
      expect(cleaned).toBe(1);
      expect(getCache('temp')).toBeNull();
      expect(getCache('permanent')).toBe('value');
    });
  });

  describe('withCache', () => {
    it('should return cached value if exists', async () => {
      setCache('api:data', { cached: true });

      const fetcher = async () => ({ fetched: true });
      const result = await withCache('api:data', fetcher);

      expect(result).toEqual({ cached: true });
    });

    it('should call fetcher if cache miss', async () => {
      const fetcher = async () => ({ fetched: true });
      const result = await withCache('api:new-data', fetcher);

      expect(result).toEqual({ fetched: true });
    });

    it('should cache fetcher result', async () => {
      let callCount = 0;
      const fetcher = async () => {
        callCount++;
        return { count: callCount };
      };

      await withCache('api:calls', fetcher);
      await withCache('api:calls', fetcher);

      expect(callCount).toBe(1);
    });

    it('should skip cache when disabled', async () => {
      let callCount = 0;
      const fetcher = async () => {
        callCount++;
        return { count: callCount };
      };

      await withCache('api:calls', fetcher, { enabled: false });
      await withCache('api:calls', fetcher, { enabled: false });

      expect(callCount).toBe(2);
    });
  });

  describe('makeCacheKey', () => {
    it('should join parts with colon', () => {
      const key = makeCacheKey('user', '123', 'profile');
      expect(key).toBe('user:123:profile');
    });

    it('should filter undefined parts', () => {
      const key = makeCacheKey('user', undefined, 'profile');
      expect(key).toBe('user:profile');
    });

    it('should handle single part', () => {
      const key = makeCacheKey('simple');
      expect(key).toBe('simple');
    });

    it('should handle empty input', () => {
      const key = makeCacheKey();
      expect(key).toBe('');
    });

    it('should handle numbers', () => {
      const key = makeCacheKey('tenant', 123, 'item', 456);
      expect(key).toBe('tenant:123:item:456');
    });
  });
});
