import { NextRequest, NextResponse } from 'next/server';
import { trackIntentSignal, trackPageView, trackHighIntentAction } from '@/lib/services/intent-tracking';
import { auth } from '@/lib/auth';

/**
 * POST /api/intent/track
 * Track intent signal
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      signalType,
      intensity,
      score,
      companyId,
      leadId,
      metadata,
      ipAddress,
      userAgent,
      page,
      referrer,
    } = body;

    // Get workspace (simplified - should get from user's active workspace)
    const workspace = await getWorkspaceForUser(session.user.email);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const signalId = await trackIntentSignal({
      workspaceId: workspace.id,
      companyId,
      leadId,
      signalType,
      intensity: intensity || 1.0,
      score: score || 10,
      metadata,
      ipAddress,
      userAgent,
      page,
      referrer,
    });

    if (!signalId) {
      return NextResponse.json(
        { error: 'Failed to track intent signal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, signalId });
  } catch (error) {
    console.error('Track intent error:', error);
    return NextResponse.json(
      { error: 'Failed to track intent' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/intent/track/pageview
 * Track page view with automatic IP lookup
 */
export async function trackPageViewHandler(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { page, referrer, duration } = body;

    // Get IP from headers
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Get workspace
    const workspace = await getWorkspaceForUser(session.user.email);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    await trackPageView({
      ipAddress,
      userAgent,
      page,
      referrer,
      duration,
      workspaceId: workspace.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track page view error:', error);
    return NextResponse.json(
      { error: 'Failed to track page view' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/intent/track/action
 * Track high-intent action
 */
export async function trackActionHandler(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { actionType, leadId, metadata } = body;

    // Get IP
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // Get workspace
    const workspace = await getWorkspaceForUser(session.user.email);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    await trackHighIntentAction({
      actionType,
      ipAddress,
      workspaceId: workspace.id,
      leadId,
      metadata,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track action error:', error);
    return NextResponse.json(
      { error: 'Failed to track action' },
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
