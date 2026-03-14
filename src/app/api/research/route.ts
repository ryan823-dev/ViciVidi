import { NextRequest, NextResponse } from 'next/server'
import { getUser, getWorkspace } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { enrichFromBraveSearch } from '@/lib/services/brave-search'

// Schema for research template
const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  prompt: z.string().min(1),
  outputType: z.enum(['text', 'list', 'json']),
  isPublic: z.boolean().optional().default(false),
})

// Schema for executing research
const executeResearchSchema = z.object({
  companyIds: z.array(z.string()),
  templateId: z.string().optional(),
  customPrompt: z.string().optional(),
})

// GET /api/research/templates - List research templates
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspace = await getWorkspace()
    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const includePublic = searchParams.get('includePublic') === 'true'

    const templates = await prisma.researchTemplate.findMany({
      where: includePublic
        ? {
            OR: [
              { workspaceId: workspace.id },
              { isPublic: true },
            ],
          }
        : { workspaceId: workspace.id },
      orderBy: { usageCount: 'desc' },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/research/templates - Create research template
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspace = await getWorkspace()
    if (!workspace) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = createTemplateSchema.parse(body)

    const template = await prisma.researchTemplate.create({
      data: {
        workspaceId: workspace.id,
        ...validated,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}