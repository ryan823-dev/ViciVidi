/**
 * 配额管理 API
 * GET: 获取用户配额状态
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserQuota, checkQuota } from '@/lib/services/quota'
import { Plan } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    // 在开发模式下，返回模拟数据
    const isDev = !process.env.SUPABASE_URL || !process.env.SUPABASE_URL.startsWith('https://')
    
    if (isDev) {
      return NextResponse.json({
        plan: 'STARTER' as Plan,
        companies: {
          used: 127,
          limit: 1000,
          remaining: 873,
          percentage: 13,
        },
        emailVerifications: {
          used: 12,
          limit: 50,
          remaining: 38,
          extra: 0,
          percentage: 24,
        },
        exports: {
          used: 3,
          limit: 10,
          remaining: 7,
          percentage: 30,
        },
        periodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        periodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }

    // 生产模式：从 Supabase 获取真实数据
    // TODO: 实现真实的用户认证后，从这里获取 userId
    const userId = 'user-id-from-auth'
    
    const quota = await getUserQuota(userId)
    
    const companiesCheck = await checkQuota(userId, 'companies', 0)
    const emailCheck = await checkQuota(userId, 'emailVerifications', 0)
    const exportCheck = await checkQuota(userId, 'exports', 0)

    return NextResponse.json({
      plan: quota.plan,
      companies: {
        used: companiesCheck.used,
        limit: companiesCheck.limit === Infinity ? -1 : companiesCheck.limit,
        remaining: companiesCheck.remaining === Infinity ? -1 : companiesCheck.remaining,
        percentage: companiesCheck.limit === Infinity ? 0 : Math.round((companiesCheck.used / companiesCheck.limit) * 100),
      },
      emailVerifications: {
        used: emailCheck.used,
        limit: emailCheck.limit === Infinity ? -1 : emailCheck.limit,
        remaining: emailCheck.remaining === Infinity ? -1 : emailCheck.remaining,
        percentage: emailCheck.limit === Infinity ? 0 : Math.round((emailCheck.used / emailCheck.limit) * 100),
      },
      exports: {
        used: exportCheck.used,
        limit: exportCheck.limit === Infinity ? -1 : exportCheck.limit,
        remaining: exportCheck.remaining === Infinity ? -1 : exportCheck.remaining,
        percentage: exportCheck.limit === Infinity ? 0 : Math.round((exportCheck.used / exportCheck.limit) * 100),
      },
      periodStart: quota.periodStart.toISOString(),
      periodEnd: quota.periodEnd.toISOString(),
    })
  } catch (error) {
    console.error('Error fetching quota:', error)
    return NextResponse.json(
      { error: '获取配额失败' },
      { status: 500 }
    )
  }
}
