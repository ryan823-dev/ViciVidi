import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getWorkspaceMember } from '@/lib/permissions'

/**
 * 定时任务管理 API
 * GET - 获取定时任务列表
 * POST - 创建新的定时任务
 * DELETE - 删除定时任务
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json({ error: '缺少工作空间 ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const member = await getWorkspaceMember(user.id, workspaceId)
    if (!member) {
      return NextResponse.json({ error: '无权访问' }, { status: 403 })
    }

    let schedules: any[] = []

    if (process.env.NODE_ENV === 'development' && !process.env.SUPABASE_URL) {
      // 开发模式模拟数据
      schedules = [
        {
          id: 'mock_1',
          workspaceId,
          name: '每周数据刷新',
          type: 'DATA_REFRESH',
          cron: '0 2 * * 1', // 每周一凌晨 2 点
          enabled: true,
          lastRunAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          nextRunAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          config: { refreshOldData: true },
          createdAt: new Date().toISOString()
        },
        {
          id: 'mock_2',
          workspaceId,
          name: '每日邮箱验证',
          type: 'EMAIL_VERIFICATION',
          cron: '0 3 * * *', // 每天凌晨 3 点
          enabled: true,
          lastRunAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          nextRunAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          config: { verifyAll: false },
          createdAt: new Date().toISOString()
        }
      ]
    } else {
      const result: any[] = await prisma.$queryRaw`
        SELECT * FROM schedules
        WHERE workspace_id = ${workspaceId}
        ORDER BY created_at DESC
      `
      schedules = result
    }

    return NextResponse.json({
      success: true,
      data: schedules
    })
  } catch (error) {
    console.error('获取定时任务失败:', error)
    return NextResponse.json(
      { error: '获取定时任务失败', details: error instanceof Error ? error.message : error },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspaceId, name, type, cron, config } = body

    if (!workspaceId || !name || !type || !cron) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const member = await getWorkspaceMember(user.id, workspaceId)
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      return NextResponse.json({ error: '无权限创建定时任务' }, { status: 403 })
    }

    // 验证 cron 表达式
    if (!isValidCron(cron)) {
      return NextResponse.json(
        { error: '无效的 cron 表达式' },
        { status: 400 }
      )
    }

    let schedule: any

    if (process.env.NODE_ENV === 'development' && !process.env.SUPABASE_URL) {
      // 开发模式模拟
      schedule = {
        id: 'mock_' + Date.now(),
        workspaceId,
        name,
        type,
        cron,
        enabled: true,
        config: config || {},
        lastRunAt: null,
        nextRunAt: calculateNextRun(cron).toISOString(),
        createdAt: new Date().toISOString()
      }
      console.log('[DEV MODE] 创建定时任务:', schedule)
    } else {
      const result: any[] = await prisma.$queryRaw`
        INSERT INTO schedules (
          workspace_id,
          user_id,
          name,
          type,
          cron,
          config,
          enabled,
          created_at
        ) VALUES (
          ${workspaceId},
          ${user.id},
          ${name},
          ${type},
          ${cron},
          ${config ? JSON.stringify(config) : null}::jsonb,
          true,
          NOW()
        )
        RETURNING *
      `
      schedule = result[0]
    }

    return NextResponse.json({
      success: true,
      data: schedule
    })
  } catch (error) {
    console.error('创建定时任务失败:', error)
    return NextResponse.json(
      { error: '创建定时任务失败', details: error instanceof Error ? error.message : error },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const scheduleId = searchParams.get('id')
    const workspaceId = searchParams.get('workspaceId')

    if (!scheduleId || !workspaceId) {
      return NextResponse.json(
        { error: '缺少任务 ID 或工作空间 ID' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const member = await getWorkspaceMember(user.id, workspaceId)
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      return NextResponse.json({ error: '无权限删除定时任务' }, { status: 403 })
    }

    if (process.env.NODE_ENV === 'development' && !process.env.SUPABASE_URL) {
      console.log('[DEV MODE] 删除定时任务:', scheduleId)
    } else {
      await prisma.$queryRaw`
        DELETE FROM schedules
        WHERE id = ${scheduleId} AND workspace_id = ${workspaceId}
      `
    }

    return NextResponse.json({
      success: true,
      message: '定时任务已删除'
    })
  } catch (error) {
    console.error('删除定时任务失败:', error)
    return NextResponse.json(
      { error: '删除定时任务失败', details: error instanceof Error ? error.message : error },
      { status: 500 }
    )
  }
}

// 辅助函数：验证 cron 表达式（简化版）
function isValidCron(cron: string): boolean {
  const parts = cron.split(' ')
  if (parts.length !== 5) return false
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
  
  // 简单验证
  const isValidNumber = (val: string, min: number, max: number) => {
    if (val === '*') return true
    if (val.includes('/')) {
      const [base, step] = val.split('/')
      if (base !== '*' && base !== '') return false
      const stepNum = parseInt(step)
      return !isNaN(stepNum) && stepNum > 0
    }
    if (val.includes('-')) {
      const [start, end] = val.split('-').map(Number)
      return !isNaN(start) && !isNaN(end) && start >= min && end <= max
    }
    if (val.includes(',')) {
      return val.split(',').every(v => {
        const num = parseInt(v)
        return !isNaN(num) && num >= min && num <= max
      })
    }
    const num = parseInt(val)
    return !isNaN(num) && num >= min && num <= max
  }

  return (
    isValidNumber(minute, 0, 59) &&
    isValidNumber(hour, 0, 23) &&
    isValidNumber(dayOfMonth, 1, 31) &&
    isValidNumber(month, 1, 12) &&
    isValidNumber(dayOfWeek, 0, 6)
  )
}

// 计算下次运行时间（简化版）
function calculateNextRun(cron: string): Date {
  const now = new Date()
  const [minute, hour] = cron.split(' ').slice(0, 2)
  
  const next = new Date(now)
  next.setHours(parseInt(hour) || 0)
  next.setMinutes(parseInt(minute) || 0)
  next.setSeconds(0)
  
  if (next <= now) {
    next.setDate(next.getDate() + 1)
  }
  
  return next
}
