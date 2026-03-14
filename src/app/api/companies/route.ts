import { NextRequest, NextResponse } from 'next/server'
import { getUser, getWorkspace } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Schema for creating a company
const createCompanySchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
  name: z.string().optional(),
  website: z.string().optional(),
})

// Schema for updating a company
const updateCompanySchema = z.object({
  name: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  stage: z.string().optional(),
  assignedTo: z.string().optional(),
  customFields: z.any().optional(),
})

// GET /api/companies - List companies
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
    const industry = searchParams.get('industry') || ''
    const country = searchParams.get('country') || ''
    const minEmployees = searchParams.get('minEmployees')
    const maxEmployees = searchParams.get('maxEmployees')
    const stage = searchParams.get('stage') || ''
    const hasEmail = searchParams.get('hasEmail') === 'true'
    const hasPhone = searchParams.get('hasPhone') === 'true'
    const tags = searchParams.getAll('tags')

    // Build advanced filters
    const where: any = {
      workspaceId: workspace.id,
      company: {},
    }

    // Search filter
    if (search) {
      where.OR = [
        { company: { name: { contains: search, mode: 'insensitive' as const } } },
        { company: { domain: { contains: search, mode: 'insensitive' as const } } },
      ]
    }

    // Industry filter
    if (industry) {
      where.company.industry = { contains: industry, mode: 'insensitive' as const }
    }

    // Country filter
    if (country) {
      where.company.country = { contains: country, mode: 'insensitive' as const }
    }

    // Employee range filter
    if (minEmployees || maxEmployees) {
      where.company.employees = {}
      if (minEmployees) where.company.employees.gte = parseInt(minEmployees)
      if (maxEmployees) where.company.employees.lte = parseInt(maxEmployees)
    }

    // Stage filter
    if (stage) {
      where.stage = stage
    }

    // Has email filter
    if (hasEmail) {
      where.company.email = { not: null }
    }

    // Has phone filter
    if (hasPhone) {
      where.company.phone = { not: null }
    }

    // Tags filter
    if (tags.length > 0) {
      where.tags = { hasSome: tags }
    }

    const [companies, total] = await Promise.all([
      prisma.workspaceCompany.findMany({
        where,
        include: {
          company: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { addedAt: 'desc' },
      }),
      prisma.workspaceCompany.count({ where }),
    ])

    return NextResponse.json({
      companies,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/companies - Create a new company
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
    const validated = createCompanySchema.parse(body)

    // Normalize domain
    const domain = validated.domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]

    // Check if company already exists in shared database
    let sharedCompany = await prisma.sharedCompany.findUnique({
      where: { domain },
    })

    // If not exists, create in shared database (will be enriched later)
    if (!sharedCompany) {
      sharedCompany = await prisma.sharedCompany.create({
        data: {
          domain,
          name: validated.name || null,
          website: validated.website || `https://${domain}`,
        },
      })
    }

    // Check if already in workspace
    const existingInWorkspace = await prisma.workspaceCompany.findUnique({
      where: {
        workspaceId_companyId: {
          workspaceId: workspace.id,
          companyId: sharedCompany.id,
        },
      },
    })

    if (existingInWorkspace) {
      return NextResponse.json(
        { error: 'Company already exists in workspace' },
        { status: 400 }
      )
    }

    // Create workspace company
    const workspaceCompany = await prisma.workspaceCompany.create({
      data: {
        workspaceId: workspace.id,
        companyId: sharedCompany.id,
      },
      include: {
        company: true,
      },
    })

    return NextResponse.json(workspaceCompany, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/companies/:id - Delete a company
export async function DELETE(request: NextRequest) {
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
    const companyId = searchParams.get('id')

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    // Check if company exists in workspace
    const existingCompany = await prisma.workspaceCompany.findUnique({
      where: {
        workspaceId_companyId: {
          workspaceId: workspace.id,
          companyId,
        },
      },
    })

    if (!existingCompany) {
      return NextResponse.json(
        { error: 'Company not found in workspace' },
        { status: 404 }
      )
    }

    // Delete the company from workspace
    await prisma.workspaceCompany.delete({
      where: {
        workspaceId_companyId: {
          workspaceId: workspace.id,
          companyId,
        },
      },
    })

    return NextResponse.json({
      message: 'Company deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/companies/:id - Update a company
export async function PUT(request: NextRequest) {
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
    const companyId = searchParams.get('id')

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = updateCompanySchema.parse(body)

    // Update workspace company
    const updatedCompany = await prisma.workspaceCompany.update({
      where: {
        workspaceId_companyId: {
          workspaceId: workspace.id,
          companyId,
        },
      },
      data: {
        ...validated,
        lastActivityAt: new Date(),
      },
      include: {
        company: true,
      },
    })

    return NextResponse.json(updatedCompany)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}