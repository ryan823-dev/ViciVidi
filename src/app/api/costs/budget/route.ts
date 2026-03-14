import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getWorkspaceMember } from '@/lib/permissions'

/**
 * 预算设置 API
 * GET - 获取预算配置
 * PUT - 更新预算设置
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

    let budget: any = null

    if (process.env.NODE_ENV === 'development' && !process.env.SUPABASE_URL) {
      // 开发模式模拟数据
      budget = {
        id: 'mock_budget',
        workspaceId,
        monthlyLimit: 1000,
        alertThreshold: 80,
        currentMonthSpending: 687.50,
        resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
      }
    } else {
      const result = await prisma.$queryRaw`
        SELECT * FROM cost_budgets
        WHERE workspace_id = ${workspaceId}
        LIMIT 1
      `
      budget = (result as any[])[0] || null
    }

    return NextResponse.json({
      success: true,
      data: budget
    })
  } catch (error) {
    console.error('获取预算设置失败:', error)
    return NextResponse.json(
      { error: '获取预算设置失败', details: error instanceof Error ? error.message : error },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspaceId, monthlyLimit, alertThreshold } = body

    if (!workspaceId) {
      return NextResponse.json({ error: '缺少工作空间 ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const member = await getWorkspaceMember(user.id, workspaceId)
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      return NextResponse.json({ error: '无权限修改预算' }, { status: 403 })
    }

    let budget: any

    if (process.env.NODE_ENV === 'development' && !process.env.SUPABASE_URL) {
      // 开发模式模拟更新
      budget = {
        id: 'mock_budget',
        workspaceId,
        monthlyLimit: monthlyLimit || 1000,
        alertThreshold: alertThreshold || 80,
        updatedAt: new Date().toISOString()
      }
      console.log('[DEV MODE] 预算更新:', budget)
    } else {
      // 生产环境：使用 upsert
      const result = await prisma.$queryRaw`
        INSERT INTO cost_budgets (
          workspace_id,
          monthly_limit,
          alert_threshold,
          updated_at
        ) VALUES (
          ${workspaceId},
          ${monthlyLimit || 1000},
          ${alertThreshold || 80},
          NOW()
        )
        ON CONFLICT (workspace_id) 
        DO UPDATE SET
          monthly_limit = EXCLUDED.monthly_limit,
          alert_threshold = EXCLUDED.alert_threshold,
          updated_at = NOW()
        RETURNING *
      `
      budget = (result as any[])[0]
    }

    return NextResponse.json({
      success: true,
      data: budget
    })
  } catch (error) {
    console.error('更新预算设置失败:', error)
    return NextResponse.json(
      { error: '更新预算设置失败', details: error instanceof Error ? error.message : error },
      { status: 500 }
    )
  }
}
