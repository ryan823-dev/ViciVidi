/**
 * 知识引擎配置
 *
 * 集中管理知识引擎相关的配置参数
 * 支持环境变量覆盖
 */

// ==================== 文件大小限制 ====================

// 单文件最大上传大小（默认 4GB）
export const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 4 * 1024 * 1024 * 1024;

// 单批次最多文件数量
export const MAX_BATCH_SIZE = Number(process.env.MAX_BATCH_FILES) || 20;

// 文档处理阈值（超过此大小使用特殊处理）
export const LARGE_DOCUMENT_THRESHOLD = Number(process.env.LARGE_DOCUMENT_THRESHOLD) || 50 * 1024 * 1024; // 50MB

// Office 文档处理阈值（超过此大小先尝试处理）
export const LARGE_OFFICE_THRESHOLD = Number(process.env.LARGE_OFFICE_THRESHOLD) || 100 * 1024 * 1024; // 100MB

// ==================== 音视频处理配置 ====================

// 是否启用音视频转录
export const ENABLE_AUDIO_TRANSCRIPTION = process.env.ENABLE_AUDIO_TRANSCRIPTION !== 'false';

// 音频/视频最大转录时长（秒）
export const AUDIO_MAX_DURATION = Number(process.env.AUDIO_MAX_DURATION) || 3600; // 1小时

// 音频/视频分片时长（秒）
export const AUDIO_CHUNK_DURATION = Number(process.env.AUDIO_CHUNK_DURATION) || 600; // 10分钟

// 音频转录超时（毫秒）
export const TRANSCRIPTION_TIMEOUT = Number(process.env.TRANSCRIPTION_TIMEOUT) || 600000; // 10分钟

// ==================== 处理重试配置 ====================

// 最大重试次数
export const MAX_RETRY_COUNT = Number(process.env.MAX_RETRY_COUNT) || 3;

// 重试初始延迟（毫秒）
export const RETRY_INITIAL_DELAY = Number(process.env.RETRY_INITIAL_DELAY) || 1000;

// 重试最大延迟（毫秒）
export const RETRY_MAX_DELAY = Number(process.env.RETRY_MAX_DELAY) || 10000;

// ==================== 分块配置 ====================

// 每块最大 token 数
export const CHUNK_MAX_TOKENS = Number(process.env.CHUNK_MAX_TOKENS) || 500;

// 块间重叠 token 数
export const CHUNK_OVERLAP_TOKENS = Number(process.env.CHUNK_OVERLAP_TOKENS) || 50;

// ==================== 处理并发配置 ====================

// 批量处理并发数
export const BATCH_CONCURRENCY = Number(process.env.BATCH_CONCURRENCY) || 3;

// 批次间延迟（毫秒）
export const BATCH_DELAY_MS = Number(process.env.BATCH_DELAY_MS) || 1500;

// 批次最大 chunk 数
export const MAX_CHUNKS_PER_BATCH = Number(process.env.MAX_CHUNKS_PER_BATCH) || 20;

// ==================== 帮助函数 ====================

/**
 * 格式化文件大小限制说明
 */
export function getFileSizeLimitLabel(): string {
  const gb = MAX_FILE_SIZE / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb}GB`;
  }
  const mb = MAX_FILE_SIZE / (1024 * 1024);
  return `${mb}MB`;
}

/**
 * 检查是否是大型文件
 */
export function isLargeFile(size: number): boolean {
  return size > LARGE_DOCUMENT_THRESHOLD;
}

/**
 * 检查是否是超大文件（需要特殊处理）
 */
export function isExtraLargeFile(size: number): boolean {
  return size > MAX_FILE_SIZE * 0.8; // 超过限制的 80%
}
