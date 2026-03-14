import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveWebhooks,
  createWebhook,
  deleteWebhook,
  testWebhook,
  sendLeadToWebhooks,
  getWebhookLogs,
} from '@/lib/services/webhook-export';
import { auth } from '@/lib/auth';

/**
 * GET /api/webhooks
 * Get all active webhooks
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspace = await getWorkspaceForUser(session.user.email);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const webhooks = await getActiveWebhooks(session.user.id, workspace.id);
    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error('Get webhooks error:', error);
    return NextResponse.json(
      { error: 'Failed to get webhooks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks
 * Create new webhook
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      url,
      method,
      headers,
      authType,
      username,
      password,
      bearerToken,
      payloadTemplate,
      retryCount,
      timeout,
    } = body;

    // Get workspace
    const workspace = await getWorkspaceForUser(session.user.email);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const webhook = await createWebhook(
      {
        url,
        method: method || 'POST',
        headers,
        authType: authType || 'none',
        username,
        password,
        bearerToken,
        payloadTemplate,
        retryCount,
        timeout,
      },
      session.user.id,
      workspace.id
    );

    if (!webhook) {
      return NextResponse.json(
        { error: 'Failed to create webhook' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, webhook });
  } catch (error) {
    console.error('Create webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks
 * Delete webhook
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const webhookId = searchParams.get('id');

    if (!webhookId) {
      return NextResponse.json(
        { error: 'Webhook ID required' },
        { status: 400 }
      );
    }

    const workspace = await getWorkspaceForUser(session.user.email);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const success = await deleteWebhook(webhookId, session.user.id, workspace.id);
    
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Delete webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
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
