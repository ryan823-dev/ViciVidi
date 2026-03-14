/**
 * 团队成员 API
 * GET: 获取团队成员列表
 * PUT: 更新成员角色
 * DELETE: 移除成员
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json(
        { error: '缺少 workspaceId' },
        { status: 400 }
      )
    }

    // 在开发模式下，返回模拟数据
    const isDev = !process.env.SUPABASE_URL || !process.env.SUPABASE_URL.startsWith('https://')
    
    if (isDev) {
      return NextResponse.json({
        members: [
          {
            id: 'member_1',
            userId: 'user_1',
            name: '张三',
            email: 'zhangsan@example.com',
            role: 'OWNER',
            avatar: null,
            joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'member_2',
            userId: 'user_2',
            name: '李四',
            email: 'lisi@example.com',
            role: 'ADMIN',
            avatar: null,
            joinedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'member_3',
            userId: 'user_3',
            name: '王五',
            email: 'wangwu@example.com',
            role: 'MEMBER',
            avatar: null,
            joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      })
    }

    // 生产模式：从数据库获取
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        role: m.role,
        avatar: m.user.image,
        joinedAt: m.joinedAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: '获取成员列表失败' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { memberId, role, workspaceId } = body

    if (!memberId || !role || !workspaceId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    if (!['ADMIN', 'MEMBER'].includes(role)) {
      return NextResponse.json(
        { error: '无效的角色类型' },
        { status: 400 }
      )
    }

    // 在开发模式下，模拟更新
    const isDev = !process.env.SUPABASE_URL || !process.env.SUPABASE_URL.startsWith('https://')
    
    if (isDev) {
      return NextResponse.json({
        success: true,
        mock: true,
        message: `开发模式：成员角色已更新为 ${role}`,
      })
    }

    // 生产模式：更新角色
    // TODO: 权限验证

    await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
    })

    return NextResponse.json({
      success: true,
      message: '角色已更新',
    })
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json(
      { error: '更新成员失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')
    const workspaceId = searchParams.get('workspaceId')

    if (!memberId || !workspaceId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 在开发模式下，模拟删除
    const isDev = !process.env.SUPABASE_URL || !process.env.SUPABASE_URL.startsWith('https://')
    
    if (isDev) {
      return NextResponse.json({
        success: true,
        mock: true,
        message: '开发模式：成员已移除',
      })
    }

    // 生产模式：移除成员
    // TODO: 权限验证

    await prisma.workspaceMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({
      success: true,
      message: '成员已移除',
    })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { error: '移除成员失败' },
      { status: 500 }
    )
  }
}
