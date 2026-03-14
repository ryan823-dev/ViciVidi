/**
 * API 密钥管理接口
 * GET - 获取所有API配置
 * POST - 创建/更新API密钥
 * DELETE - 删除API密钥
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// 支持的服务列表
export const SUPPORTED_SERVICES = [
  {
    id: 'google_places',
    name: 'Google Places',
    description: '公司信息丰富',
    requiresSecret: false,
    freeQuota: '$200/月',
    signUpUrl: 'https://console.cloud.google.com/',
    icon: '🗺️',
  },
  {
    id: 'brave_search',
    name: 'Brave Search',
    description: '搜索/邮箱查找',
    requiresSecret: false,
    freeQuota: '2000次/月',
    signUpUrl: 'https://api.search.brave.com/',
    icon: '🔍',
  },
  {
    id: 'apollo',
    name: 'Apollo.io',
    description: '公司+联系人一体化',
    requiresSecret: false,
    freeQuota: '50次/月',
    signUpUrl: 'https://developer.apollo.io/',
    icon: '🚀',
  },
  {
    id: 'skrapp',
    name: 'Skrapp.io',
    description: '邮箱查找（主用）',
    requiresSecret: false,
    freeQuota: '100次/月',
    signUpUrl: 'https://skrapp.io/api',
    icon: '📧',
  },
  {
    id: 'hunter',
    name: 'Hunter.io',
    description: '邮箱查找（备用）',
    requiresSecret: false,
    freeQuota: '25次/月',
    signUpUrl: 'https://hunter.io/api',
    icon: '🎯',
  },
  {
    id: 'firecrawl',
    name: 'Firecrawl',
    description: '复杂站点抓取',
    requiresSecret: false,
    freeQuota: '500次/月',
    signUpUrl: 'https://www.firecrawl.dev/',
    icon: '🔥',
  },
  {
    id: 'companies_house',
    name: 'Companies House',
    description: '英国公司数据',
    requiresSecret: false,
    freeQuota: '免费',
    signUpUrl: 'https://developer.company-information.service.gov.uk/',
    icon: '🇬🇧',
  },
  {
    id: 'qcc',
    name: '企查查',
    description: '中国企业数据',
    requiresSecret: true,
    freeQuota: '按量付费',
    signUpUrl: 'https://openapi.qcc.com/',
    icon: '🏢',
  },
  {
    id: 'tyc',
    name: '天眼查',
    description: '中国企业数据',
    requiresSecret: false,
    freeQuota: '按量付费',
    signUpUrl: 'https://open.tianyancha.com/',
    icon: '👁️',
  },
  {
    id: 'clearbit',
    name: 'Clearbit',
    description: '公司/联系人数据补齐',
    requiresSecret: false,
    freeQuota: '有限免费',
    signUpUrl: 'https://clearbit.com/api',
    icon: '🎯',
  },
  {
    id: 'clay',
    name: 'Clay',
    description: '瀑布式数据丰富化 (75+ 数据源)',
    requiresSecret: false,
    freeQuota: '试用额度',
    signUpUrl: 'https://clay.com/api',
    icon: '🏺',
  },
  {
    id: 'pdl',
    name: 'People Data Labs',
    description: '28 亿 + 联系人档案，超高质量丰富化',
    requiresSecret: false,
    freeQuota: '免费试用 + 按需付费',
    signUpUrl: 'https://www.peopledatalabs.com/api',
    icon: '👥',
  },
  {
    id: 'dataforseo',
    name: 'DataForSEO',
    description: '企业数据 + 搜索引擎挖掘（预留）',
    requiresSecret: false,
    freeQuota: '$50 起充',
    signUpUrl: 'https://dataforseo.com/',
    icon: '📊',
    comingSoon: true,
  },
]

// GET - 获取所有API配置
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 获取用户的工作空间
    const workspace = await prisma.workspace.findFirst({
      where: {
        members: {
          some: { userId: user.id }
        }
      }
    })

    if (!workspace) {
      return NextResponse.json({ error: '未找到工作空间' }, { status: 404 })
    }

    // 获取已保存的配置
    const savedConfigs = await prisma.apiKeyConfig.findMany({
      where: { workspaceId: workspace.id }
    })

    // 合并服务列表和已保存的配置
    const services = SUPPORTED_SERVICES.map(service => {
      const saved = savedConfigs.find(c => c.service === service.id)
      return {
        ...service,
        isConfigured: !!saved?.apiKey,
        isEnabled: saved?.isEnabled ?? true,
        lastUsedAt: saved?.lastUsedAt,
        notes: saved?.notes,
        // 不返回实际密钥，只返回是否已配置
        hasKey: !!saved?.apiKey,
        hasSecret: !!saved?.apiSecret,
      }
    })

    return NextResponse.json({
      success: true,
      data: services,
      workspaceId: workspace.id
    })
  } catch (error) {
    console.error('获取API配置失败:', error)
    return NextResponse.json(
      { error: '获取API配置失败' },
      { status: 500 }
    )
  }
}

// POST - 创建/更新API密钥
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const { workspaceId, service, apiKey, apiSecret, isEnabled, notes } = body

    // 验证服务是否支持
    if (!SUPPORTED_SERVICES.find(s => s.id === service)) {
      return NextResponse.json({ error: '不支持的服务' }, { status: 400 })
    }

    // 验证权限
    const member = await prisma.workspaceMember.findFirst({
      where: { userId: user.id, workspaceId }
    })

    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      return NextResponse.json({ error: '无权限修改API配置' }, { status: 403 })
    }

    // Upsert 配置
    const config = await prisma.apiKeyConfig.upsert({
      where: {
        service
      },
      update: {
        apiKey,
        apiSecret,
        isEnabled: isEnabled ?? true,
        notes,
      },
      create: {
        workspaceId,
        service,
        apiKey,
        apiSecret,
        isEnabled: isEnabled ?? true,
        notes,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        service: config.service,
        isConfigured: true,
        isEnabled: config.isEnabled,
      }
    })
  } catch (error) {
    console.error('保存API密钥失败:', error)
    return NextResponse.json(
      { error: '保存API密钥失败' },
      { status: 500 }
    )
  }
}

// DELETE - 删除API密钥
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const service = searchParams.get('service')

    if (!workspaceId || !service) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 })
    }

    // 验证权限
    const member = await prisma.workspaceMember.findFirst({
      where: { userId: user.id, workspaceId }
    })

    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      return NextResponse.json({ error: '无权限删除API配置' }, { status: 403 })
    }

    await prisma.apiKeyConfig.deleteMany({
      where: { workspaceId, service }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除API密钥失败:', error)
    return NextResponse.json(
      { error: '删除API密钥失败' },
      { status: 500 }
    )
  }
}