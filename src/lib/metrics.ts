/**
 * 统一监控和埋点模块
 * 提供性能监控、错误追踪、用户行为分析等基础设施
 */

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'timer';

export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  tags?: Record<string, string>;
  timestamp?: number;
}

export interface TimingMetric {
  name: string;
  duration: number;
  tags?: Record<string, string>;
}

// 内存中的指标存储（生产环境可替换为 Prometheus/StatsD）
const metrics = new Map<string, Metric[]>();
const counters = new Map<string, number>();
const gauges = new Map<string, number>();

/**
 * 计数器 +1
 */
export function incrementCounter(name: string, tags?: Record<string, string>): void {
  const key = makeMetricKey(name, tags);
  counters.set(key, (counters.get(key) ?? 0) + 1);
}

/**
 * 设置 Gauge 值
 */
export function setGauge(name: string, value: number, tags?: Record<string, string>): void {
  const key = makeMetricKey(name, tags);
  gauges.set(key, value);
}

/**
 * 记录直方图值
 */
export function recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
  const key = makeMetricKey(name, tags);
  const metric: Metric = {
    name,
    type: 'histogram',
    value,
    tags,
    timestamp: Date.now(),
  };

  if (!metrics.has(key)) {
    metrics.set(key, []);
  }
  metrics.get(key)!.push(metric);

  // 保留最近 1000 条记录
  const entries = metrics.get(key)!;
  if (entries.length > 1000) {
    entries.shift();
  }
}

/**
 * 计时器：返回结束函数
 */
export function startTimer(name: string, tags?: Record<string, string>): () => void {
  const start = Date.now();

  return () => {
    const duration = Date.now() - start;
    recordHistogram(`${name}.duration`, duration, tags);
  };
}

/**
 * 异步函数计时包装器
 */
export async function withTimer<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const start = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - start;
    recordHistogram(`${name}.duration`, duration, { ...tags, status: 'success' });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    recordHistogram(`${name}.duration`, duration, { ...tags, status: 'error' });
    throw error;
  }
}

/**
 * 获取计数器当前值
 */
export function getCounter(name: string, tags?: Record<string, string>): number {
  const key = makeMetricKey(name, tags);
  return counters.get(key) ?? 0;
}

/**
 * 获取 Gauge 当前值
 */
export function getGauge(name: string, tags?: Record<string, string>): number {
  const key = makeMetricKey(name, tags);
  return gauges.get(key) ?? 0;
}

/**
 * 获取直方图统计信息
 */
export function getHistogramStats(name: string, tags?: Record<string, string>): {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
} | null {
  const key = makeMetricKey(name, tags);
  const entries = metrics.get(key);

  if (!entries || entries.length === 0) {
    return null;
  }

  const values = entries.map((e) => e.value).sort((a, b) => a - b);
  const count = values.length;
  const sum = values.reduce((a, b) => a + b, 0);

  return {
    count,
    sum,
    avg: sum / count,
    min: values[0],
    max: values[count - 1],
    p50: values[Math.floor(count * 0.5)],
    p95: values[Math.floor(count * 0.95)],
    p99: values[Math.floor(count * 0.99)],
  };
}

/**
 * 获取所有指标摘要
 */
export function getMetricsSummary(): {
  counters: Record<string, number>;
  gauges: Record<string, number>;
  histograms: Record<string, ReturnType<typeof getHistogramStats>>;
} {
  const countersObj: Record<string, number> = {};
  const gaugesObj: Record<string, number> = {};
  const histogramsObj: Record<string, ReturnType<typeof getHistogramStats>> = {};

  counters.forEach((value, key) => {
    countersObj[key] = value;
  });

  gauges.forEach((value, key) => {
    gaugesObj[key] = value;
  });

  // 提取唯一的直方图名称
  const histogramNames = new Set<string>();
  metrics.forEach((_, key) => {
    const name = key.split(':')[0];
    histogramNames.add(name);
  });

  histogramNames.forEach((name) => {
    histogramsObj[name] = getHistogramStats(name);
  });

  return {
    counters: countersObj,
    gauges: gaugesObj,
    histograms: histogramsObj,
  };
}

/**
 * 重置所有指标（用于测试）
 */
export function resetMetrics(): void {
  metrics.clear();
  counters.clear();
  gauges.clear();
}

/**
 * 生成指标键
 */
function makeMetricKey(name: string, tags?: Record<string, string>): string {
  if (!tags) return name;

  const tagStr = Object.entries(tags)
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join(',');

  return `${name}{${tagStr}}`;
}

// ==================== 业务事件埋点 ====================

export interface TrackEvent {
  event: string;
  properties?: Record<string, unknown>;
  userId?: string;
  tenantId?: string;
  timestamp?: number;
}

const eventBuffer: TrackEvent[] = [];
const MAX_BUFFER_SIZE = 100;

/**
 * 跟踪用户事件
 */
export function track(event: string, properties?: Record<string, unknown>): void {
  const trackEvent: TrackEvent = {
    event,
    properties,
    timestamp: Date.now(),
  };

  eventBuffer.push(trackEvent);

  // 达到缓冲上限时刷新
  if (eventBuffer.length >= MAX_BUFFER_SIZE) {
    flushEvents();
  }

  // 开发环境打印
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Analytics] ${event}`, properties);
  }
}

/**
 * 跟踪页面访问
 */
export function trackPageView(
  path: string,
  properties?: Record<string, unknown>
): void {
  track('page_view', {
    path,
    ...properties,
  });
}

/**
 * 跟踪雷达搜索事件
 */
export function trackRadarSearch(
  query: string,
  resultsCount: number,
  duration: number,
  tenantId: string
): void {
  incrementCounter('radar.search.total', { tenantId });
  recordHistogram('radar.search.results', resultsCount, { tenantId });
  recordHistogram('radar.search.duration', duration, { tenantId });

  track('radar_search', {
    query,
    resultsCount,
    duration,
    tenantId,
  });
}

/**
 * 跟踪内容生成事件
 */
export function trackContentGeneration(
  contentType: string,
  status: 'success' | 'error',
  duration: number,
  tenantId: string
): void {
  incrementCounter(`content.generation.${status}`, { tenantId, type: contentType });
  recordHistogram('content.generation.duration', duration, { tenantId, type: contentType });

  track('content_generation', {
    contentType,
    status,
    duration,
    tenantId,
  });
}

/**
 * 刷新事件缓冲区（生产环境发送到分析服务）
 */
export function flushEvents(): void {
  if (eventBuffer.length === 0) return;

  // 生产环境：发送到分析服务（如 Segment、Amplitude）
  if (process.env.ANALYTICS_ENDPOINT) {
    fetch(process.env.ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: eventBuffer }),
    }).catch((err) => console.error('[Analytics] Failed to send events:', err));
  }

  // 清空缓冲区
  eventBuffer.length = 0;
}

// ==================== 错误追踪 ====================

export interface ErrorContext {
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 记录错误
 */
export function trackError(
  error: Error,
  context?: ErrorContext
): void {
  incrementCounter('errors.total');
  if (context?.component) {
    incrementCounter('errors.by_component', { component: context.component });
  }

  const errorData = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  };

  // 生产环境发送到错误追踪服务（如 Sentry）
  if (process.env.SENTRY_DSN) {
    // Sentry.captureException(error, { extra: context });
    console.debug('[ErrorTracking] Would send to Sentry:', errorData);
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', errorData);
  }
}

// ==================== 健康检查 ====================

export interface HealthStatus {
  healthy: boolean;
  checks: {
    database?: boolean;
    cache?: boolean;
    external?: boolean;
  };
  uptime: number;
  timestamp: number;
}

const startTime = Date.now();

/**
 * 获取系统健康状态
 */
export function getHealthStatus(): HealthStatus {
  return {
    healthy: true, // 详细检查留给外部监控系统
    checks: {
      database: true,
      cache: true,
    },
    uptime: Date.now() - startTime,
    timestamp: Date.now(),
  };
}
