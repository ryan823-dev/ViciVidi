import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getWorkspaceMember } from '@/lib/permissions'

/**
 * 数据分析 API
 * GET - 获取分析数据
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const workspaceId = searchParams.get('workspaceId')
    const timeRange = searchParams.get('timeRange') || '30d'

    if (!workspaceId) {
      return NextResponse.json({ error: '缺少工作空间 ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const member = await getWorkspaceMember(user.id, workspaceId)
    if (!member) {
      return NextResponse.json({ error: '无权访问' }, { status: 403 })
    }

    // 获取日期范围
    const dateRange = getDateRange(timeRange)

    let analytics: any = {}

    if (process.env.NODE_ENV === 'development' && !process.env.SUPABASE_URL) {
      // 开发模式模拟数据
      analytics = generateMockAnalytics(dateRange)
    } else {
      // 生产环境从数据库获取
      analytics = await getAnalyticsData(workspaceId, dateRange)
    }

    return NextResponse.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    console.error('获取分析数据失败:', error)
    return NextResponse.json(
      { error: '获取分析数据失败', details: error instanceof Error ? error.message : error },
      { status: 500 }
    )
  }
}

function getDateRange(timeRange: string) {
  const now = new Date()
  let startDate = new Date()

  switch (timeRange) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case 'all':
      startDate = new Date(0) // 从开始
      break
  }

  return { startDate, endDate: now }
}

async function getAnalyticsData(workspaceId: string, dateRange: any) {
  // 这里实现真实的数据分析逻辑
  // 简化版本返回基础统计
  
  return {
    overview: {
      totalCompanies: 0,
      totalLists: 0,
      totalEmails: 0,
      apiCalls: 0
    },
    trends: {
      companiesGrowth: [],
      apiCallsByDay: [],
      costsByDay: []
    },
    breakdown: {
      byIndustry: [],
      byCountry: [],
      bySource: []
    }
  }
}

function generateMockAnalytics(dateRange: any) {
  const days = Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // 生成趋势数据
  const companiesGrowth = Array.from({ length: days }, (_, i) => {
    const date = new Date(dateRange.endDate.getTime() - (days - i - 1) * 24 * 60 * 60 * 1000)
    return {
      date: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 50) + 100 + i * 5
    }
  })

  const apiCallsByDay = Array.from({ length: days }, (_, i) => {
    const date = new Date(dateRange.endDate.getTime() - (days - i - 1) * 24 * 60 * 60 * 1000)
    return {
      date: date.toISOString().split('T')[0],
      value: Math.floor(Math.random() * 200) + 50
    }
  })

  const costsByDay = Array.from({ length: days }, (_, i) => {
    const date = new Date(dateRange.endDate.getTime() - (days - i - 1) * 24 * 60 * 60 * 1000)
    return {
      date: date.toISOString().split('T')[0],
      value: parseFloat((Math.random() * 10 + 2).toFixed(2))
    }
  })

  return {
    overview: {
      totalCompanies: 1250,
      totalLists: 18,
      totalEmails: 890,
      apiCalls: 3420,
      totalCost: 287.50,
      avgConfidence: 0.87
    },
    trends: {
      companiesGrowth,
      apiCallsByDay,
      costsByDay
    },
    breakdown: {
      byIndustry: [
        { name: ' technology', value: 320, percentage: 25.6 },
        { name: '制造业', value: 280, percentage: 22.4 },
        { name: '金融业', value: 200, percentage: 16.0 },
        { name: '医疗健康', value: 180, percentage: 14.4 },
        { name: '零售业', value: 150, percentage: 12.0 },
        { name: '其他', value: 120, percentage: 9.6 }
      ],
      byCountry: [
        { name: '美国', value: 450, percentage: 36.0 },
        { name: '中国', value: 300, percentage: 24.0 },
        { name: '英国', value: 180, percentage: 14.4 },
        { name: '德国', value: 150, percentage: 12.0 },
        { name: '其他', value: 170, percentage: 13.6 }
      ],
      bySource: [
        { name: 'Google Places', value: 520, percentage: 41.6 },
        { name: 'Brave Search', value: 380, percentage: 30.4 },
        { name: 'Hunter.io', value: 230, percentage: 18.4 },
        { name: 'Firecrawl', value: 120, percentage: 9.6 }
      ]
    },
    topLists: [
      { id: 'list_1', name: '潜在客户 Q1', count: 156, updatedAt: new Date().toISOString() },
      { id: 'list_2', name: '科技公司决策者', count: 142, updatedAt: new Date().toISOString() },
      { id: 'list_3', name: '医疗设备供应商', count: 98, updatedAt: new Date().toISOString() },
      { id: 'list_4', name: '出口目标客户', count: 87, updatedAt: new Date().toISOString() }
    ],
    recentActivity: {
      thisWeek: 125,
      lastWeek: 98,
      growth: 27.55
    }
  }
}
