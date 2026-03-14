import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

/**
 * 通知系统 API
 * GET - 获取用户通知列表
 * POST - 创建新通知
 * PUT - 标记通知为已读
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    let notifications: any[] = []

    if (process.env.NODE_ENV === 'development' && !process.env.SUPABASE_URL) {
      // 开发模式模拟数据
      notifications = generateMockNotifications(user.id, unreadOnly)
    } else {
      // 生产环境从数据库获取
      const result: any[] = await prisma.$queryRaw`
        SELECT * FROM notifications
        WHERE user_id = ${user.id}
        ${unreadOnly ? 'AND read = false' : ''}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `
      notifications = result
    }

    // 统计未读数量
    const unreadCount = process.env.NODE_ENV === 'development' && !process.env.SUPABASE_URL
      ? notifications.filter(n => !n.read).length
      : ((await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM notifications
          WHERE user_id = ${user.id} AND read = false
        `) as any[])[0].count

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount: parseInt(unreadCount.count)
      }
    })
  } catch (error) {
    console.error('获取通知失败:', error)
    return NextResponse.json(
      { error: '获取通知失败', details: error instanceof Error ? error.message : error },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, title, message, data, workspaceId } = body

    // 验证必填字段
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    let notification: any

    if (process.env.NODE_ENV === 'development' && !process.env.SUPABASE_URL) {
      // 开发模式模拟
      notification = {
        id: 'mock_' + Date.now(),
        userId,
        type,
        title,
        message,
        data: data || {},
        workspaceId,
        read: false,
        createdAt: new Date().toISOString()
      }
      console.log('[DEV MODE] 创建通知:', notification)
    } else {
      const result: any[] = await prisma.$queryRaw`
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          data,
          workspace_id,
          read,
          created_at
        ) VALUES (
          ${userId},
          ${type},
          ${title},
          ${message},
          ${data ? JSON.stringify(data) : null}::jsonb,
          ${workspaceId || null},
          false,
          NOW()
        )
        RETURNING *
      `
      notification = result[0]
    }

    return NextResponse.json({
      success: true,
      data: notification
    })
  } catch (error) {
    console.error('创建通知失败:', error)
    return NextResponse.json(
      { error: '创建通知失败', details: error instanceof Error ? error.message : error },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, read } = body

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    if (process.env.NODE_ENV === 'development' && !process.env.SUPABASE_URL) {
      console.log('[DEV MODE] 更新通知状态:', { notificationId, read })
      return NextResponse.json({
        success: true,
        data: { id: notificationId, read }
      })
    }

    const result: any[] = await prisma.$queryRaw`
      UPDATE notifications
      SET read = ${read},
          updated_at = NOW()
      WHERE id = ${notificationId} AND user_id = ${user.id}
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      data: result[0]
    })
  } catch (error) {
    console.error('更新通知失败:', error)
    return NextResponse.json(
      { error: '更新通知失败', details: error instanceof Error ? error.message : error },
      { status: 500 }
    )
  }
}

// 生成模拟通知数据
function generateMockNotifications(userId: string, unreadOnly?: boolean) {
  const notifications = [
    {
      id: 'mock_1',
      userId,
      type: 'BUDGET_ALERT',
      title: '预算警报',
      message: '您的本月 API 支出已达到预算的 85%',
      data: { currentSpending: 850, budget: 1000, threshold: 80 },
      workspaceId: 'workspace_id',
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 小时前
    },
    {
      id: 'mock_2',
      userId,
      type: 'TASK_COMPLETED',
      title: '任务完成',
      message: '定时任务 "每周数据刷新" 已成功执行',
      data: { taskName: '每周数据刷新', taskType: 'DATA_REFRESH', status: 'success' },
      workspaceId: 'workspace_id',
      read: false,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 天前
    },
    {
      id: 'mock_3',
      userId,
      type: 'DUPLICATE_DETECTED',
      title: '发现重复公司',
      message: '检测到 2 组重复的公司记录，建议合并',
      data: { duplicateCount: 2 },
      workspaceId: 'workspace_id',
      read: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 天前
    },
    {
      id: 'mock_4',
      userId,
      type: 'QUOTA_WARNING',
      title: '配额不足',
      message: '您的公司配额即将用尽，剩余 15 个',
      data: { remaining: 15, limit: 100 },
      workspaceId: 'workspace_id',
      read: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 天前
    },
    {
      id: 'mock_5',
      userId,
      type: 'TEAM_INVITE',
      title: '新成员加入',
      message: '张三 已接受邀请加入团队',
      data: { memberName: '张三', memberEmail: 'zhangsan@example.com', role: 'MEMBER' },
      workspaceId: 'workspace_id',
      read: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 天前
    }
  ]

  return unreadOnly ? notifications.filter(n => !n.read) : notifications
}
