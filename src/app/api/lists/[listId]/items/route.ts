import { NextRequest, NextResponse } from 'next/server'
import { getUser, getWorkspace } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Schema for adding companies to list
const addCompaniesSchema = z.object({
  companyIds: z.array(z.string()),
})

// POST /api/lists/[listId]/items - Add companies to list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspace = await getWorkspace()
    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const { listId } = await params
    const body = await request.json()
    const { companyIds } = addCompaniesSchema.parse(body)

    // Verify list belongs to workspace
    const list = await prisma.list.findUnique({
      where: { id: listId },
      select: { workspaceId: true },
    })

    if (!list || list.workspaceId !== workspace.id) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      )
    }

    // Add companies to list
    const items = companyIds.map((companyId: string) => ({
      listId,
      companyId,
    }))

    await prisma.listItem.createMany({
      data: items,
      skipDuplicates: true,
    })

    return NextResponse.json({
      message: `Added ${companyIds.length} companies to list`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error adding companies to list:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/lists/[listId]/items - Remove company from list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspace = await getWorkspace()
    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const { listId } = await params
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    await prisma.listItem.deleteMany({
      where: {
        listId,
        companyId,
      },
    })

    return NextResponse.json({ message: 'Company removed from list' })
  } catch (error) {
    console.error('Error removing company from list:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/lists/[listId]/items - Get list items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspace = await getWorkspace()
    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const { listId } = await params

    const items = await prisma.listItem.findMany({
      where: { listId },
      orderBy: { addedAt: 'desc' },
    })

    // 手动关联公司信息
    const itemsWithCompanies = await Promise.all(
      items.map(async (item) => {
        const company = await prisma.workspaceCompany.findUnique({
          where: {
            workspaceId_companyId: {
              workspaceId: workspace.id,
              companyId: item.companyId,
            },
          },
          include: {
            company: true,
          },
        })
        return {
          ...item,
          company: company || undefined,
        }
      })
    )

    return NextResponse.json({
      items: itemsWithCompanies,
      total: itemsWithCompanies.length,
    })
  } catch (error) {
    console.error('Error fetching list items:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}