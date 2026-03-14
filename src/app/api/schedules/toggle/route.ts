import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getWorkspaceMember } from '@/lib/permissions'

/**
 * 切换定时任务状态 API
 * POST - 启用/禁用定时任务
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { scheduleId, workspaceId, enabled } = body

    if (!scheduleId || !workspaceId) {
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
      return NextResponse.json({ error: '无权限操作' }, { status: 403 })
    }

    if (process.env.NODE_ENV === 'development' && !process.env.SUPABASE_URL) {
      console.log('[DEV MODE] 切换定时任务状态:', { scheduleId, enabled })
      return NextResponse.json({
        success: true,
        data: { id: scheduleId, enabled }
      })
    }

    const result: any[] = await prisma.$queryRaw`
      UPDATE schedules
      SET enabled = ${enabled}
      WHERE id = ${scheduleId} AND workspace_id = ${workspaceId}
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      data: result[0]
    })
  } catch (error) {
    console.error('切换定时任务状态失败:', error)
    return NextResponse.json(
      { error: '切换定时任务状态失败', details: error instanceof Error ? error.message : error },
      { status: 500 }
    )
  }
}
