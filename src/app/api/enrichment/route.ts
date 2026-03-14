import { NextRequest, NextResponse } from 'next/server'
import { getUser, getWorkspace } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { enrichCompanyData } from '@/lib/services/enrichment'
import { z } from 'zod'

// Schema for enrichment request
const enrichSchema = z.object({
  companyId: z.string(),
  usePaidSources: z.boolean().optional().default(false),
})

// POST /api/enrichment/company - Enrich company data
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
    const { companyId, usePaidSources } = enrichSchema.parse(body)

    // Verify company belongs to workspace
    const workspaceCompany = await prisma.workspaceCompany.findUnique({
      where: {
        workspaceId_companyId: {
          workspaceId: workspace.id,
          companyId,
        },
      },
      include: {
        company: true,
      },
    })

    if (!workspaceCompany) {
      return NextResponse.json(
        { error: 'Company not found in workspace' },
        { status: 404 }
      )
    }

    // Enrich company data
    const result = await enrichCompanyData(companyId, {
      usePaidSources,
      priority: 'accuracy',
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: result.message,
      company: result.company,
      cost: result.cost,
      sourcesAdded: result.sourcesAdded,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error enriching company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}