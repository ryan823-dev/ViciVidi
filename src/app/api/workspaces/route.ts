import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Schema for creating a workspace
const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
})

// GET /api/workspaces - List user's workspaces
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspaces = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: {
        workspace: {
          include: {
            _count: {
              select: {
                companies: true,
                members: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    })

    return NextResponse.json({
      workspaces: workspaces.map((member) => ({
        ...member.workspace,
        role: member.role,
        companyCount: member.workspace._count.companies,
        memberCount: member.workspace._count.members,
      })),
      total: workspaces.length,
    })
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/workspaces - Create a new workspace
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createWorkspaceSchema.parse(body)

    // Check if slug is already taken
    const existing = await prisma.workspace.findUnique({
      where: { slug: validated.slug },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Workspace slug already exists' },
        { status: 400 }
      )
    }

    // Create workspace and add user as owner
    const workspace = await prisma.workspace.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    })

    // Initialize quota for user in this workspace
    await prisma.userQuota.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        plan: 'STARTER',
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    return NextResponse.json(workspace, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating workspace:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}