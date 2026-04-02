import { NextRequest, NextResponse } from 'next/server'
import { getUser, getWorkspace } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

// ===== GET /api/intent/dashboard =====
// 聚合每个 lead 的意图信号，返回意图排行榜 + 近期实时信号流
export async function GET(req: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspace = await getWorkspace()
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const { searchParams } = req.nextUrl
    const days = parseInt(searchParams.get('days') || '30', 10)

    const since = new Date()
    since.setDate(since.getDate() - days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    // 并发查询：聚合意图分 + 实时信号流
    const [rawSignals, recentRawSignals] = await Promise.all([
      // 所有 lead 维度信号（30天内）
      prisma.intentSignal.findMany({
        where: {
          workspaceId: workspace.id,
          occurredAt: { gte: since },
          leadId: { not: null },
        },
        include: {
          lead: { select: { id: true, companyName: true, domain: true, status: true } },
        },
        orderBy: { occurredAt: 'desc' },
      }),
      // 近24小时实时信号
      prisma.intentSignal.findMany({
        where: {
          workspaceId: workspace.id,
          occurredAt: { gte: twentyFourHoursAgo },
        },
        include: {
          lead: { select: { id: true, companyName: true, domain: true } },
        },
        orderBy: [{ score: 'desc' }, { occurredAt: 'desc' }],
        take: 50,
      }),
    ])

    // ===== 按 leadId 聚合意图得分 =====
    const leadMap = new Map<string, {
      leadId: string
      companyName: string
      domain: string
      status: string
      totalScore: number
      signalCount: number
      recentSignals: number
      prevScore: number  // 7天前得分（用于计算趋势）
      topSignals: Array<{ type: string; score: number; occurredAt: Date }>
    }>()

    for (const sig of rawSignals) {
      if (!sig.leadId || !sig.lead) continue

      const daysSince = (Date.now() - sig.occurredAt.getTime()) / (1000 * 60 * 60 * 24)
      const timeWeight = Math.max(0.5, 1 - daysSince / 30)
      const weightedScore = Math.round(sig.score * sig.intensity * timeWeight)

      if (!leadMap.has(sig.leadId)) {
        leadMap.set(sig.leadId, {
          leadId: sig.leadId,
          companyName: sig.lead.companyName,
          domain: sig.lead.domain ?? '',
          status: sig.lead.status,
          totalScore: 0,
          signalCount: 0,
          recentSignals: 0,
          prevScore: 0,
          topSignals: [],
        })
      }

      const entry = leadMap.get(sig.leadId)!
      entry.totalScore += weightedScore
      entry.signalCount += 1
      if (sig.occurredAt >= sevenDaysAgo) entry.recentSignals += 1
      // 超过7天的信号贡献"旧分"，用于趋势对比
      if (sig.occurredAt < sevenDaysAgo) entry.prevScore += weightedScore
      entry.topSignals.push({ type: sig.signalType, score: weightedScore, occurredAt: sig.occurredAt })
    }

    // 整理成数组，计算 scoreLevel + trend，截取 top5 signals
    const intentScores = Array.from(leadMap.values())
      .map((e) => {
        const recentScore = e.totalScore - e.prevScore
        let scoreLevel: 'low' | 'medium' | 'high' | 'critical'
        if (e.totalScore >= 200) scoreLevel = 'critical'
        else if (e.totalScore >= 100) scoreLevel = 'high'
        else if (e.totalScore >= 50) scoreLevel = 'medium'
        else scoreLevel = 'low'

        let trend: 'up' | 'down' | 'stable'
        if (recentScore > e.prevScore * 0.3) trend = 'up'
        else if (recentScore < e.prevScore * 0.1 && e.prevScore > 0) trend = 'down'
        else trend = 'stable'

        const topSignals = e.topSignals
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
          .map((s) => ({
            type: s.type,
            score: s.score,
            timestamp: formatRelativeTime(s.occurredAt),
          }))

        return {
          leadId: e.leadId,
          companyName: e.companyName,
          domain: e.domain,
          status: e.status,
          totalScore: e.totalScore,
          scoreLevel,
          signalCount: e.signalCount,
          recentSignals: e.recentSignals,
          trend,
          topSignals,
        }
      })
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 50)

    // ===== 实时信号流格式化 =====
    const signals = recentRawSignals.map((sig) => ({
      id: sig.id,
      companyName: sig.lead?.companyName ?? (sig.metadata as any)?.companyName ?? '未知公司',
      domain: sig.lead?.domain ?? '',
      leadId: sig.leadId,
      signalType: sig.signalType,
      intensity: sig.intensity,
      score: sig.score,
      timestamp: formatRelativeTime(sig.occurredAt),
      status: 'new' as const,  // 实时信号流默认为 new；后续可以加 viewed 状态
    }))

    // ===== 统计卡数据 =====
    const stats = {
      totalSignals: rawSignals.length,
      criticalLeads: intentScores.filter((s) => s.scoreLevel === 'critical').length,
      highLeads: intentScores.filter((s) => s.scoreLevel === 'high').length,
      newSignals24h: recentRawSignals.length,
    }

    return NextResponse.json({ intentScores, signals, stats })
  } catch (error) {
    console.error('Intent dashboard error:', error)
    return NextResponse.json({ error: 'Failed to load intent dashboard' }, { status: 500 })
  }
}

// ===== 工具函数：相对时间格式化 =====
function formatRelativeTime(date: Date): string {
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}
