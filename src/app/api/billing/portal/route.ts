import { NextRequest, NextResponse } from 'next/server'
import { createBillingPortal } from '@/lib/stripe/billing'
import { auth } from '@/lib/auth'

/**
 * POST /api/billing/portal
 * 创建计费门户会话
 */
export async function POST(req: NextRequest) {
  try {
    // 1. 验证用户登录
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. 获取基础 URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    `https://${req.headers.get('host')}`

    // 3. 创建门户会话
    const { portalUrl } = await createBillingPortal({
      userId: session.user.id,
      returnUrl: `${baseUrl}/subscription/manage`,
    })

    return NextResponse.json({
      portalUrl,
    })
  } catch (error) {
    console.error('Portal API Error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
