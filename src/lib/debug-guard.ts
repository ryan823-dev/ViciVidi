// ==================== Debug Route Guard ====================
// Debug 路由保护：生产环境禁用 + 密钥验证

import { NextRequest, NextResponse } from 'next/server';

/**
 * 检查是否为允许的环境
 * 生产环境默认禁用所有 debug 路由
 */
export function isDebugEnabled(): boolean {
  // 开发环境总是允许
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // 测试环境允许（但需要密钥）
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  // 生产环境需要显式启用
  return process.env.DEBUG_ROUTES_ENABLED === 'true';
}

/**
 * 验证 debug 路由访问
 * 返回错误响应如果不允许访问
 */
export function verifyDebugAccess(request: NextRequest): NextResponse | null {
  // 1. 检查环境
  if (!isDebugEnabled()) {
    return NextResponse.json(
      { error: 'Debug routes disabled in production' },
      { status: 403 }
    );
  }

  // 2. 验证密钥（开发和测试环境可选，生产环境必须）
  const secret = request.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.CRON_SECRET || process.env.DEBUG_SECRET;

  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing secret' },
        { status: 401 }
      );
    }
  } else if (secret && secret !== expectedSecret) {
    // 非生产环境，密钥错误时警告但不阻止
    console.warn('[Debug] Invalid secret provided');
  }

  return null;
}

/**
 * 创建标准 debug 响应
 */
export function debugResponse(data: unknown, options?: { status?: number }): NextResponse {
  return NextResponse.json(data, {
    status: options?.status ?? 200,
    headers: {
      'X-Debug-Mode': 'true',
      'X-Environment': process.env.NODE_ENV || 'unknown',
    },
  });
}

/**
 * Debug 错误处理
 */
export function debugError(error: unknown, context?: string): NextResponse {
  console.error(`[Debug${context ? ` ${context}` : ''}] Error:`, error);

  return NextResponse.json(
    {
      ok: false,
      error: 'Debug operation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.stack
        : undefined,
    },
    {
      status: 500,
      headers: {
        'X-Debug-Error': 'true',
      },
    }
  );
}
