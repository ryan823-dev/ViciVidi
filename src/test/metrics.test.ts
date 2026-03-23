import { describe, it, expect, beforeEach } from 'vitest';
import {
  incrementCounter,
  setGauge,
  recordHistogram,
  startTimer,
  withTimer,
  getCounter,
  getGauge,
  getHistogramStats,
  getMetricsSummary,
  resetMetrics,
  trackRadarSearch,
  trackContentGeneration,
} from '../lib/metrics';

describe('Metrics Module', () => {
  beforeEach(() => {
    resetMetrics();
  });

  describe('Counter', () => {
    it('should increment counter', () => {
      incrementCounter('test.counter');
      incrementCounter('test.counter');
      expect(getCounter('test.counter')).toBe(2);
    });

    it('should increment counter with tags', () => {
      incrementCounter('api.requests', { method: 'GET' });
      incrementCounter('api.requests', { method: 'POST' });
      expect(getCounter('api.requests', { method: 'GET' })).toBe(1);
    });
  });

  describe('Gauge', () => {
    it('should set and get gauge value', () => {
      setGauge('memory.usage', 1024);
      expect(getGauge('memory.usage')).toBe(1024);
    });
  });

  describe('Histogram', () => {
    it('should record histogram values', () => {
      recordHistogram('response.time', 100);
      recordHistogram('response.time', 200);
      const stats = getHistogramStats('response.time');
      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(2);
    });

    it('should return null for unknown histogram', () => {
      expect(getHistogramStats('nonexistent')).toBeNull();
    });
  });

  describe('Timer', () => {
    it('should measure elapsed time', async () => {
      const endTimer = startTimer('operation');
      await new Promise((r) => setTimeout(r, 50));
      endTimer();
      // startTimer appends .duration to name
      const stats = getHistogramStats('operation.duration');
      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(1);
    });
  });

  describe('withTimer', () => {
    it('should time async operations', async () => {
      const result = await withTimer('db.query', async () => {
        await new Promise((r) => setTimeout(r, 10));
        return { data: 'test' };
      });
      expect(result).toEqual({ data: 'test' });
    });
  });

  describe('getMetricsSummary', () => {
    it('should return all metrics', () => {
      incrementCounter('requests.total');
      setGauge('memory.usage', 2048);
      const summary = getMetricsSummary();
      expect(summary.counters).toHaveProperty('requests.total');
      expect(summary.gauges).toHaveProperty('memory.usage');
    });
  });

  describe('Business Events', () => {
    it('should track radar search', () => {
      trackRadarSearch('coating industry', 50, 1200, 'tenant-123');
      expect(getCounter('radar.search.total', { tenantId: 'tenant-123' })).toBe(1);
    });

    it('should track content generation', () => {
      trackContentGeneration('blog', 'success', 3000, 'tenant-456');
      expect(getCounter('content.generation.success', { tenantId: 'tenant-456', type: 'blog' })).toBe(1);
    });
  });
});
