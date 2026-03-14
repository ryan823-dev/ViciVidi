import { NextRequest, NextResponse } from 'next/server'
import { getUser, getWorkspace } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { enrichFromBraveSearch } from '@/lib/services/brave-search'

// Schema for executing research
const executeResearchSchema = z.object({
  companyIds: z.array(z.string()),
  templateId: z.string().optional(),
  customPrompt: z.string().optional(),
})

// POST /api/research/execute - Execute research on companies
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
    const { companyIds, templateId, customPrompt } = executeResearchSchema.parse(body)

    // Get template or use custom prompt
    let prompt = customPrompt
    if (templateId) {
      const template = await prisma.researchTemplate.findUnique({
        where: { id: templateId },
      })

      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        )
      }

      prompt = template.prompt

      // Update usage count
      await prisma.researchTemplate.update({
        where: { id: templateId },
        data: { usageCount: { increment: 1 } },
      })
    }

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Execute research for each company
    const results = []
    for (const companyId of companyIds) {
      try {
        // Get company info
        const company = await prisma.workspaceCompany.findUnique({
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

        if (!company) continue

        // Execute search based on prompt
        const searchQuery = `${company.company.name || company.company.domain} ${prompt}`
        const searchResult = await enrichFromBraveSearch(
          company.company.domain,
          searchQuery
        )

        if (searchResult) {
          results.push({
            companyId,
            companyName: company.company.name || company.company.domain,
            data: searchResult.data,
            sources: searchResult.sources,
          })
        }
      } catch (error) {
        console.error(`Error researching company ${companyId}:`, error)
      }
    }

    return NextResponse.json({
      results,
      total: results.length,
      processed: companyIds.length,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error executing research:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
