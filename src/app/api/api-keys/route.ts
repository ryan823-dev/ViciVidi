/**
 * API 密钥管理 API
 * GET: 获取用户的 API 密钥列表
 * POST: 创建新的 API 密钥
 * DELETE: 撤销 API 密钥
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { randomBytes } from 'crypto'

// 生成 API 密钥
function generateApiKey(): string {
  return 'sk_live_' + randomBytes(32).toString('hex')
}

export async function GET(request: NextRequest) {
  try {
    // 在开发模式下，返回模拟数据
    const isDev = !process.env.SUPABASE_URL || !process.env.SUPABASE_URL.startsWith('https://')
    
    if (isDev) {
      return NextResponse.json({
        keys: [
          {
            id: 'key_1',
            name: '生产密钥',
            keyPrefix: 'sk_live_abc123...',
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            lastUsedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            expiresAt: null,
          },
          {
            id: 'key_2',
            name: '测试密钥',
            keyPrefix: 'sk_live_def456...',
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            lastUsedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            expiresAt: null,
          },
        ],
      })
    }

    // 生产模式：从数据库获取
    // TODO: 从认证中获取 userId
    const userId = 'user-id-from-auth'

    const keys = await prisma.apiKey.findMany({
      where: { userId, revoked: false },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
    })

    return NextResponse.json({ keys })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { error: '获取 API 密钥失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: '缺少密钥名称' },
        { status: 400 }
      )
    }

    // 在开发模式下，模拟创建
    const isDev = !process.env.SUPABASE_URL || !process.env.SUPABASE_URL.startsWith('https://')
    
    if (isDev) {
      const newKey = 'sk_live_' + randomBytes(32).toString('hex')
      return NextResponse.json({
        success: true,
        mock: true,
        message: '开发模式：API 密钥已创建',
        key: {
          id: 'key_' + Date.now(),
          name,
          key: newKey, // 仅在创建时返回完整密钥
          keyPrefix: newKey.substring(0, 15) + '...',
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          expiresAt: null,
        },
      })
    }

    // 生产模式：创建真实的 API 密钥
    // TODO: 从认证中获取 userId
    const userId = 'user-id-from-auth'

    const fullKey = generateApiKey()
    const keyPrefix = fullKey.substring(0, 15) + '...'

    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        name,
        key: fullKey, // 实际应该加密存储
        keyPrefix,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 年有效期
      },
    })

    return NextResponse.json({
      success: true,
      key: {
        id: apiKey.id,
        name: apiKey.name,
        key: fullKey, // 仅返回一次
        keyPrefix: apiKey.keyPrefix,
        createdAt: apiKey.createdAt,
        lastUsedAt: apiKey.lastUsedAt,
        expiresAt: apiKey.expiresAt,
      },
      warning: '请安全保存此密钥，它将只显示一次！',
    })
  } catch (error) {
    console.error('Error creating API key:', error)
    return NextResponse.json(
      { error: '创建 API 密钥失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get('id')

    if (!keyId) {
      return NextResponse.json(
        { error: '缺少密钥 ID' },
        { status: 400 }
      )
    }

    // 在开发模式下，模拟删除
    const isDev = !process.env.SUPABASE_URL || !process.env.SUPABASE_URL.startsWith('https://')
    
    if (isDev) {
      return NextResponse.json({
        success: true,
        mock: true,
        message: '开发模式：API 密钥已撤销',
      })
    }

    // 生产模式：撤销密钥
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { revoked: true },
    })

    return NextResponse.json({
      success: true,
      message: 'API 密钥已撤销',
    })
  } catch (error) {
    console.error('Error revoking API key:', error)
    return NextResponse.json(
      { error: '撤销 API 密钥失败' },
      { status: 500 }
    )
  }
}
