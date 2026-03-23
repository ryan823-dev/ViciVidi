// ==================== Error Handling Utilities ====================
// 统一错误处理工具

/**
 * 应用错误基类
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * 业务错误（4xx）
 */
export class BusinessError extends AppError {
  constructor(message: string, code: string = 'BUSINESS_ERROR', details?: Record<string, unknown>) {
    super(message, code, 400, details);
    this.name = 'BusinessError';
  }
}

/**
 * 认证错误
 */
export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized', code: string = 'AUTH_ERROR') {
    super(message, code, 401);
    this.name = 'AuthError';
  }
}

/**
 * 权限错误
 */
export class PermissionError extends AppError {
  constructor(message: string = 'Forbidden', code: string = 'PERMISSION_DENIED') {
    super(message, code, 403);
    this.name = 'PermissionError';
  }
}

/**
 * 资源未找到
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} not found: ${id}` : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

/**
 * 验证错误
 */
export class ValidationAppError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationAppError';
  }
}

/**
 * 格式化错误用于日志
 */
export function formatErrorLog(
  context: string,
  error: unknown,
  additional?: Record<string, unknown>
): Record<string, unknown> {
  const log: Record<string, unknown> = {
    context,
    timestamp: new Date().toISOString(),
  };

  if (error instanceof AppError) {
    log.type = error.name;
    log.code = error.code;
    log.message = error.message;
    log.statusCode = error.statusCode;
    if (error.details) log.details = error.details;
  } else if (error instanceof Error) {
    log.type = 'Error';
    log.message = error.message;
    log.stack = error.stack;
  } else {
    log.type = 'Unknown';
    log.error = String(error);
  }

  if (additional) {
    Object.assign(log, additional);
  }

  return log;
}

/**
 * 安全地获取错误消息（不暴露内部细节）
 */
export function getSafeErrorMessage(error: unknown, showDetails = false): string {
  // 生产环境不暴露内部错误细节
  if (process.env.NODE_ENV === 'production' && !showDetails) {
    if (error instanceof AppError) {
      return error.message;
    }
    return 'An error occurred. Please try again.';
  }

  // 开发/测试环境显示更多细节
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * 检查是否是 AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * 检查是否是客户端可显示的错误
 */
export function isClientSafeError(error: unknown): boolean {
  if (error instanceof AppError) {
    // 只有业务错误应该暴露给客户端
    return error.statusCode >= 400 && error.statusCode < 500;
  }
  return false;
}

/**
 * 安全获取错误消息字符串（用于日志）
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

/**
 * 从 catch 块安全地记录错误
 */
export function logError(context: string, error: unknown, additional?: Record<string, unknown>): void {
  const formatted = formatErrorLog(context, error, additional);
  console.error(JSON.stringify(formatted, null, 2));
}

/**
 * 标准错误响应格式
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
}

/**
 * 创建标准错误响应
 */
export function errorResponse(error: unknown, showDetails = false): ErrorResponse {
  const message = getSafeErrorMessage(error, showDetails);
  const response: ErrorResponse = {
    success: false,
    error: { message },
  };

  if (error instanceof AppError) {
    response.error.code = error.code;
    if (error.details && (showDetails || process.env.NODE_ENV !== 'production')) {
      response.error.details = error.details;
    }
  }

  return response;
}

/**
 * 带统一错误处理的 async 函数包装器
 */
export async function withErrorHandling<T>(
  context: string,
  fn: () => Promise<T>,
  options?: {
    onError?: (error: unknown) => void;
    fallback?: T;
  }
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logError(context, error);
    options?.onError?.(error);
    if (options?.fallback !== undefined) {
      return options.fallback;
    }
    throw error;
  }
}

/**
 * 带重试的函数执行
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoff?: boolean;
  } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const delayMs = options.delayMs ?? 1000;
  const backoff = options.backoff ?? true;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const waitTime = backoff ? delayMs * Math.pow(2, attempt) : delayMs;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}
