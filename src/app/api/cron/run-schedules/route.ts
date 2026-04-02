import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { enrichCompaniesBatch } from '@/lib/services/enrichment'

/**
 * GET /api/cron/run-schedules
 *
 * Vercel Cron 触发器（每小时一次）。
 * 扫描所有已启用的 Schedule，判断是否到了执行时间，然后按类型派发任务。
 *
 * 支持的 Schedule 类型：
 *   DATA_REFRESH        —— 对超过 N 天未更新的公司重新丰富化
 *   EMAIL_VERIFICATION  —— 对未验证邮箱的线索批量验证
 *
 * 鉴权：校验 CRON_SECRET，防止外部任意触发。
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const results: Array<{ scheduleId: string; type: string; status: string; detail?: string }> = []

  try {
    // 查询所有启用的 schedules（raw query，因为 Schedule 模型在 schema 里用 raw SQL 管理）
    const schedules: any[] = await prisma.$queryRaw`
      SELECT * FROM schedules
      WHERE enabled = true
      AND (next_run_at IS NULL OR next_run_at <= ${now})
      ORDER BY next_run_at ASC NULLS FIRST
      LIMIT 20
    `

    for (const schedule of schedules) {
      try {
        let detail = ''

        if (schedule.type === 'DATA_REFRESH') {
          detail = await runDataRefresh(schedule)
        } else if (schedule.type === 'EMAIL_VERIFICATION') {
          detail = await runEmailVerification(schedule)
        } else {
          detail = `Unknown schedule type: ${schedule.type}`
        }

        // 计算下次运行时间并更新 last_run_at
        const nextRun = calculateNextRun(schedule.cron)
        await prisma.$queryRaw`
          UPDATE schedules
          SET last_run_at = ${now},
              next_run_at = ${nextRun},
              updated_at  = ${now}
          WHERE id = ${schedule.id}
        `

        results.push({ scheduleId: schedule.id, type: schedule.type, status: 'success', detail })
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err)
        console.error(`Schedule ${schedule.id} failed:`, errMsg)

        // 即使失败也要更新 next_run_at，防止卡死
        const nextRun = calculateNextRun(schedule.cron)
        await prisma.$queryRaw`
          UPDATE schedules
          SET next_run_at = ${nextRun}, updated_at = ${now}
          WHERE id = ${schedule.id}
        `.catch(() => {})

        results.push({ scheduleId: schedule.id, type: schedule.type, status: 'failed', detail: errMsg })
      }
    }

    return NextResponse.json({
      success: true,
      ran: results.length,
      results,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Cron run-schedules error:', error)
    return NextResponse.json(
      { error: 'Cron execution failed', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// ===== DATA_REFRESH 执行逻辑 =====
async function runDataRefresh(schedule: any): Promise<string> {
  const config = schedule.config ?? {}
  const staleDays: number = config.staleDays ?? 30

  const staleDate = new Date()
  staleDate.setDate(staleDate.getDate() - staleDays)

  // 找到超过 staleDays 天未更新的公司（限制一次最多100条防超时）
  const staleCompanies: any[] = await prisma.$queryRaw`
    SELECT id FROM shared_companies
    WHERE (last_verified_at IS NULL OR last_verified_at < ${staleDate})
    ORDER BY last_verified_at ASC NULLS FIRST
    LIMIT 100
  `

  if (staleCompanies.length === 0) {
    return 'No stale companies found'
  }

  const ids = staleCompanies.map((c: any) => c.id)
  const batchResult = await enrichCompaniesBatch(ids, {
    usePaidSources: config.usePaidSources ?? false,
    priority: 'cost',
  })

  return `Refreshed ${batchResult.success}/${ids.length} companies (cost: $${batchResult.totalCost.toFixed(3)})`
}

// ===== EMAIL_VERIFICATION 执行逻辑 =====
async function runEmailVerification(schedule: any): Promise<string> {
  const config = schedule.config ?? {}
  const workspaceId: string = schedule.workspace_id

  // Find leads in this workspace that have an email but no EmailVerification record yet
  const leads = await prisma.lead.findMany({
    where: {
      workspaceId,
      email: { not: null },
      emailVerifications: { none: {} },
    },
    select: { id: true, email: true },
    take: config.limit ?? 100,
  })

  if (leads.length === 0) {
    return 'No unverified emails found'
  }

  let verified = 0
  let invalid = 0

  // 批量验证（并发5个）
  const BATCH = 5
  for (let i = 0; i < leads.length; i += BATCH) {
    const batch = leads.slice(i, i + BATCH)
    await Promise.allSettled(
      batch.map(async (lead: { id: string; email: string | null }) => {
        if (!lead.email) return
        const result = await verifyEmailSyntax(lead.email)
        // Record the verification result in EmailVerification table
        const companyDomain = lead.email.split('@')[1] ?? 'unknown'
        // Find a SharedCompany by domain if possible, else store against lead only
        const sharedCompany = await prisma.sharedCompany.findUnique({
          where: { domain: companyDomain },
          select: { id: true },
        })
        if (sharedCompany) {
          await prisma.emailVerification.upsert({
            where: { companyId_email: { companyId: sharedCompany.id, email: lead.email } },
            create: {
              companyId: sharedCompany.id,
              leadId: lead.id,
              email: lead.email,
              source: 'hunter',
              confidence: result.valid ? 0.9 : 0.1,
              verifiedBy: 'cron',
            },
            update: {
              confidence: result.valid ? 0.9 : 0.1,
              verifiedAt: new Date(),
            },
          })
        }
        if (result.valid) verified++
        else invalid++
      })
    )
    // 防止 rate limit
    if (i + BATCH < leads.length) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  return `Verified ${leads.length} emails: ${verified} valid, ${invalid} invalid`
}

// ===== 简单邮箱语法/MX 验证 =====
async function verifyEmailSyntax(email: string): Promise<{ valid: boolean; reason?: string }> {
  // 语法校验
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, reason: 'invalid_syntax' }
  }

  // 常见一次性邮箱域名过滤
  const disposableDomains = ['mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email']
  const domain = email.split('@')[1]?.toLowerCase()
  if (disposableDomains.includes(domain)) {
    return { valid: false, reason: 'disposable_email' }
  }

  // 若配置了 Hunter.io，走 API 验证
  if (process.env.HUNTER_API_KEY) {
    try {
      const res = await fetch(
        `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${process.env.HUNTER_API_KEY}`,
        { signal: AbortSignal.timeout(5000) }
      )
      if (res.ok) {
        const data = await res.json()
        const status = data.data?.status
        return {
          valid: status === 'valid',
          reason: status,
        }
      }
    } catch {
      // Hunter 失败时降级为语法校验结果
    }
  }

  return { valid: true }
}

// ===== 计算 cron 下次运行时间（基础实现，支持常见格式）=====
function calculateNextRun(cronExpr: string): Date {
  const now = new Date()
  const parts = cronExpr.trim().split(/\s+/)
  if (parts.length !== 5) return new Date(now.getTime() + 60 * 60 * 1000)

  const [minutePart, hourPart] = parts
  const next = new Date(now)
  next.setSeconds(0)
  next.setMilliseconds(0)

  const minute = minutePart === '*' ? now.getMinutes() : parseInt(minutePart) || 0
  const hour = hourPart === '*' ? now.getHours() : parseInt(hourPart) || 0

  next.setMinutes(minute)
  next.setHours(hour)

  // 如果计算出的时间已过，加一天
  if (next <= now) {
    next.setDate(next.getDate() + 1)
  }

  return next
}
