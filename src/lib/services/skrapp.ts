/**
 * Skrapp.io API 服务
 * 性价比最高的邮箱查找和验证服务
 * 
 * 官网：https://skrapp.io/
 * API 文档：https://skrapp.io/api
 * 
 * 定价（2025）：
 * - 免费计划：100 次/月
 * - Starter：$49/月，1,000 次
 * - Professional：$99/月，5,000 次
 * 
 * 特点：
 * - 准确率：80%+
 * - 支持 LinkedIn 集成
 * - 邮箱验证功能
 * - 批量处理
 */

interface SkrappEmailResult {
  email: string
  status: 'valid' | 'invalid' | 'catch-all' | 'unknown'
  confidence: number
  sources?: string[]
}

interface SkrappSearchResult {
  success: boolean
  emails: Array<{
    email: string
    first_name?: string
    last_name?: string
    position?: string
    confidence: number
  }>
}

interface EnrichmentResult {
  data: Record<string, unknown>
  sources: Array<{
    field: string
    source_url: string
    snippet: string
    confidence: number
    verified_at: string
  }>
}

const SKRAPP_API = 'https://api.skrapp.io/v2'

/**
 * 通过域名查找公司邮箱
 */
export async function findEmailsFromSkrapp(
  domain: string
): Promise<SkrappSearchResult | null> {
  const apiKey = process.env.SKRAPP_API_KEY

  if (!apiKey) {
    console.warn('Skrapp API key not configured')
    return null
  }

  try {
    const response = await fetch(`${SKRAPP_API}/domain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        domain,
        limit: 10,
      }),
    })

    if (!response.ok) {
      console.error('Skrapp domain search error:', response.status)
      return null
    }

    const data = await response.json()
    
    return {
      success: true,
      emails: (data.emails || []).map((e: any) => ({
        email: e.email,
        first_name: e.first_name,
        last_name: e.last_name,
        position: e.position,
        confidence: e.confidence || 0.8,
      })),
    }
  } catch (error) {
    console.error('Skrapp search error:', error)
    return null
  }
}

/**
 * 通过姓名和公司域名查找邮箱
 */
export async function findEmailFromSkrapp(
  firstName: string,
  lastName: string,
  domain: string
): Promise<SkrappEmailResult | null> {
  const apiKey = process.env.SKRAPP_API_KEY

  if (!apiKey) {
    return null
  }

  try {
    const response = await fetch(`${SKRAPP_API}/find`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        domain,
      }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    if (!data.email) {
      return null
    }

    return {
      email: data.email,
      status: data.status || 'valid',
      confidence: data.confidence || 0.8,
      sources: data.sources,
    }
  } catch (error) {
    console.error('Skrapp find error:', error)
    return null
  }
}

/**
 * 验证邮箱
 */
export async function verifyEmailWithSkrapp(
  email: string
): Promise<SkrappEmailResult | null> {
  const apiKey = process.env.SKRAPP_API_KEY

  if (!apiKey) {
    return null
  }

  try {
    const response = await fetch(`${SKRAPP_API}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    return {
      email: data.email,
      status: data.result || 'unknown',
      confidence: data.confidence || 0.7,
    }
  } catch (error) {
    console.error('Skrapp verify error:', error)
    return null
  }
}

/**
 * 从 LinkedIn URL 查找邮箱
 */
export async function findEmailFromLinkedIn(
  linkedinUrl: string
): Promise<SkrappEmailResult | null> {
  const apiKey = process.env.SKRAPP_API_KEY

  if (!apiKey) {
    return null
  }

  try {
    const response = await fetch(`${SKRAPP_API}/linkedin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        linkedin_url: linkedinUrl,
      }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    if (!data.email) {
      return null
    }

    return {
      email: data.email,
      status: data.status || 'valid',
      confidence: data.confidence || 0.85,
    }
  } catch (error) {
    console.error('Skrapp LinkedIn error:', error)
    return null
  }
}

/**
 * 使用 Skrapp 丰富公司邮箱数据
 */
export async function enrichFromSkrapp(
  domain: string
): Promise<EnrichmentResult | null> {
  const apiKey = process.env.SKRAPP_API_KEY

  if (!apiKey) {
    return null
  }

  try {
    const searchResult = await findEmailsFromSkrapp(domain)

    if (!searchResult || !searchResult.emails || searchResult.emails.length === 0) {
      return null
    }

    const result: EnrichmentResult = {
      data: {},
      sources: []
    }

    // 提取邮箱列表
    const emails = searchResult.emails

    // 主要邮箱（第一个高置信度的）
    const primaryEmail = emails.find(e => e.confidence >= 0.8) || emails[0]
    result.data.email = primaryEmail.email
    result.data.emails = emails.map(e => e.email)

    // 如果有联系人信息
    if (primaryEmail.first_name || primaryEmail.last_name) {
      result.data.contactName = `${primaryEmail.first_name || ''} ${primaryEmail.last_name || ''}`.trim()
    }

    if (primaryEmail.position) {
      result.data.contactPosition = primaryEmail.position
    }

    // 添加来源
    result.sources.push({
      field: 'email',
      source_url: `https://${domain}`,
      snippet: primaryEmail.email,
      confidence: primaryEmail.confidence,
      verified_at: new Date().toISOString(),
    })

    // 记录 API 调用
    await logSkrappCall('domain_search', domain, true)

    return result
  } catch (error) {
    console.error('Skrapp enrichment error:', error)
    await logSkrappCall('enrich', domain, false)
    return null
  }
}

/**
 * 批量验证邮箱
 */
export async function batchVerifyEmails(
  emails: string[]
): Promise<Map<string, SkrappEmailResult>> {
  const results = new Map<string, SkrappEmailResult>()

  for (const email of emails) {
    const result = await verifyEmailWithSkrapp(email)
    if (result) {
      results.set(email, result)
    }
    // 避免限流
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return results
}

/**
 * 记录 API 调用
 */
async function logSkrappCall(
  operation: string,
  target: string,
  success: boolean
) {
  try {
    const { prisma } = await import('@/lib/db')
    await prisma.apiCallLog.create({
      data: {
        service: 'skrapp',
        operation,
        cost: 0.05, // 约 $0.05/次
        success,
        metadata: { target, timestamp: new Date().toISOString() },
      },
    })
  } catch (error) {
    console.error('Failed to log Skrapp call:', error)
  }
}