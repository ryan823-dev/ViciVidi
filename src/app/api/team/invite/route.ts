/**
 * 团队邀请 API
 * POST: 创建团队邀请
 * GET: 获取待处理邀请列表
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, role, workspaceId } = body

    // 验证参数
    if (!email || !role || !workspaceId) {
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

    // 在开发模式下，模拟邀请
    const isDev = !process.env.SUPABASE_URL || !process.env.SUPABASE_URL.startsWith('https://')
    
    if (isDev) {
      return NextResponse.json({
        success: true,
        mock: true,
        message: `开发模式：已发送邀请邮件到 ${email}，角色为 ${role}`,
        invite: {
          id: 'mock_invite_' + Date.now(),
          email,
          role,
          workspaceId,
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      })
    }

    // 生产模式：创建邀请
    // TODO: 从认证中获取 userId 和权限验证
    const inviterId = 'user-id-from-auth'

    // 检查邀请者是否有权限
    const inviterMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: inviterId,
        },
      },
    })

    if (!inviterMembership || !['OWNER', 'ADMIN'].includes(inviterMembership.role)) {
      return NextResponse.json(
        { error: '无权邀请成员' },
        { status: 403 }
      )
    }

    // 检查用户是否已是成员
    const existingMember = await prisma.user.findUnique({
      where: { email },
      include: {
        workspaces: {
          where: { workspaceId },
        },
      },
    })

    if (existingMember?.workspaces.length! > 0) {
      return NextResponse.json(
        { error: '该用户已是团队成员' },
        { status: 400 }
      )
    }

    // 创建邀请（需要创建 Invitation 模型，这里简化处理）
    // 实际应该创建邀请记录并发送邮件
    const invite = {
      id: 'invite_' + Date.now(),
      email,
      role,
      workspaceId,
      inviterId,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }

    // TODO: 发送邀请邮件

    return NextResponse.json({
      success: true,
      invite,
      message: '邀请已发送',
    })
  } catch (error) {
    console.error('Error creating invite:', error)
    return NextResponse.json(
      { error: '创建邀请失败' },
      { status: 500 }
    )
  }
}

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
        invites: [
          {
            id: 'mock_invite_1',
            email: 'user1@example.com',
            role: 'MEMBER',
            status: 'pending',
            inviterName: '张三',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'mock_invite_2',
            email: 'user2@example.com',
            role: 'ADMIN',
            status: 'pending',
            inviterName: '张三',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      })
    }

    // 生产模式：从数据库获取
    // TODO: 实现真实查询

    return NextResponse.json({ invites: [] })
  } catch (error) {
    console.error('Error fetching invites:', error)
    return NextResponse.json(
      { error: '获取邀请列表失败' },
      { status: 500 }
    )
  }
}
