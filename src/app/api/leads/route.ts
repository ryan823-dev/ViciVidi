import { NextRequest, NextResponse } from 'next/server'
import { getUser, getWorkspace } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Schema for creating a lead
const createLeadSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  domain: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  description: z.string().optional(),
  
  // 来源追溯
  sourceId: z.string().optional(),
  sourceUrl: z.string().optional(),
  externalId: z.string().optional(),
  taskId: z.string().optional(),
  
  // ICP 匹配评分
  matchScore: z.number().min(0).max(100).optional(),
  matchExplain: z.any().optional(),
  qualifyReason: z.string().optional(),
})

// Schema for updating a lead
const updateLeadSchema = z.object({
  status: z.enum(['NEW', 'REVIEWING', 'QUALIFIED', 'IMPORTED', 'EXCLUDED', 'ENRICHING', 'CONTACTED', 'CONVERTED']).optional(),
  tier: z.enum(['A', 'B', 'C', 'EXCLUDED']).optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  nextAction: z.string().optional(),
  nextActionDate: z.string().optional(),
  lostReason: z.string().optional(),
})

// GET /api/leads - List leads
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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const tier = searchParams.get('tier') || ''
    const industry = searchParams.get('industry') || ''
    const country = searchParams.get('country') || ''
    const priority = searchParams.get('priority') || ''
    const sourceId = searchParams.get('sourceId') || ''
    const minScore = searchParams.get('minScore') || ''

    // Build filters
    const where: any = {
      workspaceId: workspace.id,
      deletedAt: null,
    }

    // Search filter
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Status filter
    if (status) {
      where.status = status
    }

    // Tier filter
    if (tier) {
      where.tier = tier
    }

    // Priority filter
    if (priority) {
      where.priority = priority
    }

    // Industry filter
    if (industry) {
      where.industry = { contains: industry, mode: 'insensitive' }
    }

    // Country filter
    if (country) {
      where.country = { contains: country, mode: 'insensitive' }
    }

    // Source filter
    if (sourceId) {
      where.sourceId = sourceId
    }

    // Minimum score filter
    if (minScore) {
      where.matchScore = { gte: parseFloat(minScore) }
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lead.count({ where }),
    ])

    return NextResponse.json({
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/leads - Create a new lead
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
    const validated = createLeadSchema.parse(body)

    // Check if lead already exists (by domain or externalId)
    const existingLead = await prisma.lead.findFirst({
      where: {
        workspaceId: workspace.id,
        OR: [
          validated.domain ? { domain: validated.domain } : undefined,
          validated.externalId ? { externalId: validated.externalId } : undefined,
        ].filter(Boolean) as any[],
      },
    })

    if (existingLead) {
      return NextResponse.json(
        { error: 'Lead already exists' },
        { status: 400 }
      )
    }

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        workspaceId: workspace.id,
        ...validated,
        status: 'NEW',
        priority: validated.matchScore && validated.matchScore >= 80 ? 'high' : 
                validated.matchScore && validated.matchScore >= 60 ? 'medium' : 'low',
      },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
