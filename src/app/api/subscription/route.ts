/**
 * 订阅信息 API
 * GET: 获取用户订阅状态
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // 在开发模式下，返回模拟数据
    const isDev = !process.env.SUPABASE_URL || !process.env.SUPABASE_URL.startsWith('https://')
    
    if (isDev) {
      return NextResponse.json({
        plan: 'STARTER',
        status: 'active',
        interval: 'monthly',
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
      })
    }

    // 生产模式：从数据库获取
    // TODO: 从认证中获取 userId
    const userId = 'user-id-from-auth'
    
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId },
      select: {
        plan: true,
        status: true,
        interval: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    })

    if (!subscription) {
      // 没有订阅记录，返回默认的 STARTER 套餐
      return NextResponse.json({
        plan: 'STARTER',
        status: 'active',
        interval: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      })
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: '获取订阅失败' },
      { status: 500 }
    )
  }
}
