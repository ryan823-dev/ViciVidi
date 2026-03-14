import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getWorkspaceMember } from '@/lib/permissions'

/**
 * 去重检测 API
 * GET - 检测重复公司
 * POST - 合并重复公司
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const workspaceId = searchParams.get('workspaceId')
    const threshold = parseFloat(searchParams.get('threshold') || '0.85') // 相似度阈值

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

    let duplicates: any[] = []

    if (process.env.NODE_ENV === 'development' && !process.env.SUPABASE_URL) {
      // 开发模式模拟数据
      duplicates = generateMockDuplicates(workspaceId, threshold)
    } else {
      // 生产环境：查询数据库并计算相似度
      duplicates = await findDuplicates(workspaceId, threshold)
    }

    return NextResponse.json({
      success: true,
      data: {
        duplicates,
        total: duplicates.length,
        scannedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('检测重复公司失败:', error)
    return NextResponse.json(
      { error: '检测重复公司失败', details: error instanceof Error ? error.message : error },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workspaceId, duplicateGroupId, keepCompanyId, mergeCompanyId } = body

    if (!workspaceId || !duplicateGroupId || !keepCompanyId || !mergeCompanyId) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const member = await getWorkspaceMember(user.id, workspaceId)
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      return NextResponse.json({ error: '无权限执行合并操作' }, { status: 403 })
    }

    // 执行合并逻辑
    let result: any

    if (process.env.NODE_ENV === 'development' && !process.env.SUPABASE_URL) {
      console.log('[DEV MODE] 合并公司:', { keepCompanyId, mergeCompanyId })
      result = {
        success: true,
        mergedCompanyId: keepCompanyId,
        removedCompanyId: mergeCompanyId
      }
    } else {
      result = await mergeCompanies(workspaceId, keepCompanyId, mergeCompanyId)
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('合并公司失败:', error)
    return NextResponse.json(
      { error: '合并公司失败', details: error instanceof Error ? error.message : error },
      { status: 500 }
    )
  }
}

// 查找重复公司（简化版本）
async function findDuplicates(workspaceId: string, threshold: number) {
  // 获取工作空间的所有公司
  const companies: any[] = await prisma.$queryRaw`
    SELECT 
      wc.id,
      wc.company_id as "companyId",
      sc.domain,
      sc.name,
      sc.phone,
      sc.email,
      sc.website as "website",
      wc.added_at as "addedAt"
    FROM workspace_companies wc
    JOIN shared_companies sc ON wc.company_id = sc.id
    WHERE wc.workspace_id = ${workspaceId}
    ORDER BY wc.added_at DESC
  `

  const duplicates: any[] = []
  const processed = new Set<string>()

  // 两两比较（简化算法，实际生产环境需要更高效的算法）
  for (let i = 0; i < companies.length; i++) {
    for (let j = i + 1; j < companies.length; j++) {
      const company1 = companies[i]
      const company2 = companies[j]

      const similarity = calculateSimilarity(company1, company2)

      if (similarity >= threshold) {
        duplicates.push({
          id: `dup_${company1.id}_${company2.id}`,
          groupId: `group_${Math.min(company1.id, company2.id)}_${Math.max(company1.id, company2.id)}`,
          companies: [
            {
              id: company1.id,
              domain: company1.domain,
              name: company1.name,
              phone: company1.phone,
              email: company1.email,
              website: company1.website,
              addedAt: company1.addedAt
            },
            {
              id: company2.id,
              domain: company2.domain,
              name: company2.name,
              phone: company2.phone,
              email: company2.email,
              website: company2.website,
              addedAt: company2.addedAt
            }
          ],
          similarity,
          matchReasons: getMatchReasons(company1, company2)
        })
      }
    }
  }

  return duplicates
}

// 计算两个公司的相似度
function calculateSimilarity(c1: any, c2: any): number {
  let score = 0
  let factors = 0

  // 域名匹配（最高权重）
  if (c1.domain && c2.domain) {
    factors += 3
    if (c1.domain.toLowerCase() === c2.domain.toLowerCase()) {
      score += 3
    } else if (normalizeDomain(c1.domain) === normalizeDomain(c2.domain)) {
      score += 2.5
    }
  }

  // 公司名称匹配
  if (c1.name && c2.name) {
    factors += 2
    const nameSim = stringSimilarity(c1.name.toLowerCase(), c2.name.toLowerCase())
    if (nameSim > 0.8) {
      score += 2 * nameSim
    }
  }

  // 电话匹配
  if (c1.phone && c2.phone) {
    factors += 1
    if (normalizePhone(c1.phone) === normalizePhone(c2.phone)) {
      score += 1
    }
  }

  // 网站匹配
  if (c1.website && c2.website) {
    factors += 2
    if (normalizeDomain(c1.website) === normalizeDomain(c2.website)) {
      score += 2
    }
  }

  // 邮箱域名匹配
  if (c1.email && c2.email) {
    factors += 1
    const domain1 = c1.email.split('@')[1]
    const domain2 = c2.email.split('@')[1]
    if (domain1 && domain2 && domain1.toLowerCase() === domain2.toLowerCase()) {
      score += 1
    }
  }

  return factors > 0 ? score / factors : 0
}

// 获取匹配原因
function getMatchReasons(c1: any, c2: any): string[] {
  const reasons: string[] = []

  if (c1.domain && c2.domain && normalizeDomain(c1.domain) === normalizeDomain(c2.domain)) {
    reasons.push('域名相同')
  }

  if (c1.name && c2.name) {
    const nameSim = stringSimilarity(c1.name.toLowerCase(), c2.name.toLowerCase())
    if (nameSim > 0.8) {
      reasons.push(`名称相似 (${(nameSim * 100).toFixed(0)}%)`)
    }
  }

  if (c1.phone && c2.phone && normalizePhone(c1.phone) === normalizePhone(c2.phone)) {
    reasons.push('电话相同')
  }

  if (c1.website && c2.website && normalizeDomain(c1.website) === normalizeDomain(c2.website)) {
    reasons.push('网站相同')
  }

  return reasons
}

// 字符串相似度（Jaccard 相似度）
function stringSimilarity(s1: string, s2: string): number {
  const set1 = new Set(s1.split(''))
  const set2 = new Set(s2.split(''))
  
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  
  return intersection.size / union.size
}

// 标准化域名
function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .trim()
}

// 标准化电话
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

// 合并公司
async function mergeCompanies(workspaceId: string, keepId: string, mergeId: string) {
  // 这里实现合并逻辑，包括：
  // 1. 转移列表项
  // 2. 合并邮箱验证记录
  // 3. 删除重复公司
  // 简化版本：仅删除重复项
  
  await prisma.$queryRaw`
    UPDATE workspace_companies
    SET company_id = ${keepId}
    WHERE workspace_id = ${workspaceId} AND company_id = ${mergeId}
  `
  
  return {
    mergedCompanyId: keepId,
    removedCompanyId: mergeId
  }
}

// 生成模拟数据
function generateMockDuplicates(workspaceId: string, threshold: number) {
  return [
    {
      id: 'mock_dup_1',
      groupId: 'group_1',
      companies: [
        {
          id: 'comp_1',
          domain: 'example.com',
          name: 'Example Inc',
          phone: '+1-555-0100',
          email: 'info@example.com',
          website: 'https://example.com',
          addedAt: new Date().toISOString()
        },
        {
          id: 'comp_2',
          domain: 'www.example.com',
          name: 'Example Incorporated',
          phone: '555.0100',
          email: 'contact@example.com',
          website: 'http://www.example.com/',
          addedAt: new Date().toISOString()
        }
      ],
      similarity: 0.92,
      matchReasons: ['域名相同', '名称相似 (85%)', '电话相同']
    },
    {
      id: 'mock_dup_2',
      groupId: 'group_2',
      companies: [
        {
          id: 'comp_3',
          domain: 'techcorp.com',
          name: 'TechCorp Solutions',
          phone: '+1-555-0200',
          email: 'hello@techcorp.com',
          website: 'https://techcorp.com',
          addedAt: new Date().toISOString()
        },
        {
          id: 'comp_4',
          domain: 'tech-corp.com',
          name: 'Tech Corp',
          phone: '(555) 0200',
          email: 'info@tech-corp.com',
          website: 'https://www.tech-corp.com',
          addedAt: new Date().toISOString()
        }
      ],
      similarity: 0.87,
      matchReasons: ['名称相似 (78%)', '电话相同', '网站相似']
    }
  ]
}
