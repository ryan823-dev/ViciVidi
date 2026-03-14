import { NextRequest, NextResponse } from 'next/server'
import { getUser, getWorkspace } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

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
  matchScore: z.number().min(0).max(100).optional(),
  matchExplain: z.any().optional(),
  qualifyReason: z.string().optional(),
})

// GET /api/leads/[id] - Get lead by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params

    const lead = await prisma.lead.findUnique({
      where: {
        id,
        workspaceId: workspace.id,
        deletedAt: null,
      },
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Error fetching lead:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/leads/[id] - Update a lead
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params
    const body = await request.json()
    const validated = updateLeadSchema.parse(body)

    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id },
    })

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Build update data
    const updateData: any = { ...validated }

    // Auto-set qualifiedAt when status changes to QUALIFIED
    if (validated.status === 'QUALIFIED' && existingLead.status !== 'QUALIFIED') {
      updateData.qualifiedAt = new Date()
      updateData.qualifiedBy = user.id
    }

    // Auto-set importedAt when status changes to IMPORTED
    if (validated.status === 'IMPORTED' && existingLead.status !== 'IMPORTED') {
      updateData.importedAt = new Date()
    }

    // Auto-set convertedAt when status changes to CONVERTED
    if (validated.status === 'CONVERTED' && existingLead.status !== 'CONVERTED') {
      updateData.convertedAt = new Date()
    }

    // Auto-set lastContactedAt when status changes to CONTACTED
    if (validated.status === 'CONTACTED' && existingLead.status !== 'CONTACTED') {
      updateData.lastContactedAt = new Date()
    }

    // Update lead
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updatedLead)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/leads/[id] - Soft delete a lead
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params

    // Check if lead exists
    const existingLead = await prisma.lead.findUnique({
      where: { id },
    })

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Soft delete
    await prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({
      message: 'Lead deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
