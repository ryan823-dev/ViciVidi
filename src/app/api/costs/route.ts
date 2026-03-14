import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getWorkspaceMember } from '@/lib/permissions'

/**
 * 成本监控 API
 * GET - 获取成本统计数据
 * POST - 记录新的成本支出
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const workspaceId = searchParams.get('workspaceId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const groupBy = searchParams.get('groupBy') || 'service' // service, date, workspace

    if (!workspaceId) {
      return NextResponse.json({ error: '缺少工作空间 ID' }, { status: 400 })
    }

    // 检查权限
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const member = await getWorkspaceMember(user.id, workspaceId)
    if (!member) {
      return NextResponse.json({ error: '无权访问' }, { status: 403 })
    }

    // 构建查询条件
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    // 获取成本数据
    let costs: any[] = []

    if (process.env.NODE_ENV === 'development' && !process.env.SUPABASE_URL) {
      // 开发模式模拟数据
      costs = generateMockCosts(workspaceId, startDate ?? undefined, endDate ?? undefined)
    } else {
      // 生产环境从数据库获取
      const costs: any[] = await prisma.$queryRaw`
        SELECT 
          c.id,
          c.workspace_id as "workspaceId",
          c.user_id as "userId",
          c.service as service,
          c.api_call as "apiCall",
          c.credits_used as "creditsUsed",
          c.usd_cost as "usdCost",
          c.request_count as "requestCount",
          c.metadata,
          c.created_at as "createdAt"
        FROM costs c
        WHERE c.workspace_id = ${workspaceId}
        ${startDate ? `AND c.created_at >= ${new Date(startDate)}::timestamp` : ''}
        ${endDate ? `AND c.created_at <= ${new Date(endDate)}::timestamp` : ''}
        ORDER BY c.created_at DESC
      `
    }

    // 按维度聚合数据
    const aggregatedData = aggregateCosts(costs, groupBy)

    // 计算总成本
    const totalCost = costs.reduce((sum, cost) => sum + (cost.usdCost || 0), 0)
    const totalCredits = costs.reduce((sum, cost) => sum + (cost.creditsUsed || 0), 0)

    // 按服务统计
    const serviceBreakdown = aggregateCosts(costs, 'service')

    return NextResponse.json({
      success: true,
      data: {
        total: {
          cost: totalCost,
          credits: totalCredits,
          requests: costs.reduce((sum, cost) => sum + (cost.requestCount || 0), 0)
        },
        breakdown: aggregatedData,
        serviceBreakdown,
        period: {
          startDate: startDate || 'all',
          endDate: endDate || 'all'
        }
      }
    })
  } catch (error) {
    console.error('获取成本数据失败:', error)
    return NextResponse.json(
      { error: '获取成本数据失败', details: error instanceof Error ? error.message : error },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspaceId, service, apiCall, creditsUsed, usdCost, requestCount = 1, metadata } = body

    // 验证必填字段
    if (!workspaceId || !service || !creditsUsed) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    // 检查权限
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const member = await getWorkspaceMember(user.id, workspaceId)
    if (!member) {
      return NextResponse.json({ error: '无权访问' }, { status: 403 })
    }

    // 记录成本
    let cost: any

    if (process.env.NODE_ENV === 'development' && !process.env.SUPABASE_URL) {
      // 开发模式：仅记录日志
      console.log('[DEV MODE] 成本记录:', {
        workspaceId,
        service,
        apiCall,
        creditsUsed,
        usdCost,
        requestCount
      })
      cost = {
        id: 'mock_' + Date.now(),
        workspaceId,
        userId: user.id,
        service,
        apiCall: apiCall || 'unknown',
        creditsUsed,
        usdCost: usdCost || 0,
        requestCount,
        metadata,
        createdAt: new Date().toISOString()
      }
    } else {
      // 生产环境：写入数据库
      const result: any = await prisma.$queryRaw`
        INSERT INTO costs (
          workspace_id,
          user_id,
          service,
          api_call,
          credits_used,
          usd_cost,
          request_count,
          metadata,
          created_at
        ) VALUES (
          ${workspaceId},
          ${user.id},
          ${service},
          ${apiCall || 'unknown'},
          ${creditsUsed},
          ${usdCost || 0},
          ${requestCount},
          ${metadata ? JSON.stringify(metadata) : null}::jsonb,
          NOW()
        )
        RETURNING *
      `
      cost = result[0]
    }

    return NextResponse.json({
      success: true,
      data: cost
    })
  } catch (error) {
    console.error('记录成本失败:', error)
    return NextResponse.json(
      { error: '记录成本失败', details: error instanceof Error ? error.message : error },
      { status: 500 }
    )
  }
}

// 辅助函数：聚合成本数据
function aggregateCosts(costs: any[], groupBy: string) {
  const grouped = new Map()

  costs.forEach(cost => {
    let key: string

    switch (groupBy) {
      case 'date':
        key = new Date(cost.createdAt).toISOString().split('T')[0]
        break
      case 'workspace':
        key = cost.workspaceId
        break
      case 'service':
      default:
        key = cost.service
    }

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        cost: 0,
        credits: 0,
        requests: 0,
        count: 0
      })
    }

    const item = grouped.get(key)
    item.cost += cost.usdCost || 0
    item.credits += cost.creditsUsed || 0
    item.requests += cost.requestCount || 0
    item.count += 1
  })

  return Array.from(grouped.values()).sort((a, b) => b.cost - a.cost)
}

// 开发模式模拟数据生成
function generateMockCosts(workspaceId: string, startDate?: string, endDate?: string) {
  const services = [
    { name: 'Google Places', calls: ['places/nearbysearch', 'places/details', 'places/textsearch'], baseCost: 0.017 },
    { name: 'Brave Search', calls: ['web/search', 'local/search'], baseCost: 0.005 },
    { name: 'Hunter.io', calls: ['email-finder', 'domain-search', 'email-verifier'], baseCost: 0.03 },
    { name: 'Firecrawl', calls: ['crawl', 'scrape', 'map'], baseCost: 0.01 }
  ]

  const now = new Date()
  const days = startDate && endDate 
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 30

  const costs: any[] = []

  for (let i = 0; i < days; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    
    services.forEach(service => {
      // 每天随机产生一些调用
      const callCount = Math.floor(Math.random() * 50) + 10
      
      if (callCount > 0) {
        const apiCall = service.calls[Math.floor(Math.random() * service.calls.length)]
        const creditsUsed = callCount
        const usdCost = callCount * service.baseCost
        
        costs.push({
          id: `mock_${service.name}_${i}`,
          workspaceId,
          userId: 'mock_user',
          service: service.name,
          apiCall,
          creditsUsed,
          usdCost,
          requestCount: callCount,
          metadata: { project: 'demo' },
          createdAt: date.toISOString()
        })
      }
    })
  }

  return costs
}
