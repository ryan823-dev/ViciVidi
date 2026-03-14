import { NextRequest, NextResponse } from 'next/server'
import { getUser, getWorkspace } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { checkQuota, consumeQuota } from '@/lib/services/quota'
import { verifyEmailWithHunter } from '@/lib/services/hunter'
import { z } from 'zod'

// Schema for email verification request
const verifyEmailSchema = z.object({
  companyId: z.string(),
  email: z.string().email(),
})

// POST /api/email-verify - Verify an email address
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
    const { companyId, email } = verifyEmailSchema.parse(body)

    // 1. 检查配额
    const quotaCheck = await checkQuota(user.id, 'emailVerifications', 1)
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Email verification quota exceeded',
          remaining: quotaCheck.remaining,
          suggestion: 'Upgrade your plan or purchase add-on pack',
        },
        { status: 402 }
      )
    }

    // 2. 验证邮箱（调用 Hunter.io）
    const verification = await verifyEmailWithHunter(email)

    // 3. 消耗配额
    await consumeQuota(user.id, 'emailVerifications', 1)

    // 4. 保存验证结果到数据库
    await prisma.emailVerification.create({
      data: {
        companyId,
        email,
        source: 'hunter',
        confidence: verification.score / 100,
        verifiedBy: user.id,
        cost: 0.02, // Hunter.io cost per verification
      },
    })

    // 5. 记录 API 调用
    await prisma.apiCallLog.create({
      data: {
        service: 'hunter',
        operation: 'email_verifier',
        cost: 0.02,
        success: verification.valid,
        metadata: {
          email,
          score: verification.score,
          result: verification.result,
        },
      },
    })

    return NextResponse.json({
      email,
      valid: verification.valid,
      score: verification.score,
      result: verification.result,
      message: verification.valid ? 'Email is valid' : 'Email may be invalid',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error verifying email:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/email-verify - Get email verification history for a company
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
    const companyId = searchParams.get('companyId')

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      )
    }

    // Get verification history
    const verifications = await prisma.emailVerification.findMany({
      where: { companyId },
      orderBy: { verifiedAt: 'desc' },
    })

    return NextResponse.json({
      companyId,
      verifications,
      total: verifications.length,
    })
  } catch (error) {
    console.error('Error fetching email verifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}