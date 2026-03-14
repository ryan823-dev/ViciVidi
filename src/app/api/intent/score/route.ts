import { NextRequest, NextResponse } from 'next/server';
import { calculateIntentScore, getIntentSignalsTimeline } from '@/lib/services/intent-tracking';
import { auth } from '@/lib/auth';

/**
 * GET /api/intent/score
 * Calculate intent score for a lead or company
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const leadId = searchParams.get('leadId');
    const companyId = searchParams.get('companyId');

    if (!leadId && !companyId) {
      return NextResponse.json(
        { error: 'leadId or companyId required' },
        { status: 400 }
      );
    }

    // Get workspace
    const workspace = await getWorkspaceForUser(session.user.email);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const score = await calculateIntentScore(
      companyId || undefined,
      leadId || undefined,
      workspace.id
    );

    if (!score) {
      return NextResponse.json(
        { error: 'Failed to calculate score' },
        { status: 500 }
      );
    }

    return NextResponse.json({ score });
  } catch (error) {
    console.error('Calculate intent score error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate score' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/intent/timeline
 * Get intent signals timeline
 */
export async function getTimelineHandler(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const leadId = searchParams.get('leadId');
    const companyId = searchParams.get('companyId');
    const days = parseInt(searchParams.get('days') || '30');

    // Get workspace
    const workspace = await getWorkspaceForUser(session.user.email);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const timeline = await getIntentSignalsTimeline(
      workspace.id,
      leadId || undefined,
      companyId || undefined,
      days
    );

    return NextResponse.json({ timeline });
  } catch (error) {
    console.error('Get timeline error:', error);
    return NextResponse.json(
      { error: 'Failed to get timeline' },
      { status: 500 }
    );
  }
}

// Helper function
async function getWorkspaceForUser(email: string) {
  const { prisma } = await import('@/lib/db');
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      workspaces: {
        include: {
          workspace: true,
        },
      },
    },
  });

  if (!user || user.workspaces.length === 0) {
    return null;
  }

  return user.workspaces[0].workspace;
}
