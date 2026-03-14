/**
 * Hunter.io API 服务
 * 验证和查找公司邮箱
 */

interface HunterEmail {
  value: string
  score: number
  position?: string
  department?: string
  type?: string
  sources?: Array<{
    uri: string
    extracted_on: string
    last_seen_on: string
    still_on_page: boolean
  }>
}

interface HunterResponse {
  data: {
    organization: string
    emails: HunterEmail[]
    total: number
    pattern?: string
    webmail: boolean
    disposable: boolean
    accept_all: boolean
  }
  meta: {
    total: number
    params: {
      domain: string
      offset: number
      limit: number
    }
  }
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

export async function findEmailsFromHunter(
  domain: string
): Promise<EnrichmentResult | null> {
  const apiKey = process.env.HUNTER_API_KEY

  if (!apiKey) {
    console.warn('Hunter.io API key not configured')
    return null
  }

  try {
    const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${apiKey}`

    const response = await fetch(url)
    const data: HunterResponse = await response.json()

    if (!data.data || !data.data.emails || data.data.emails.length === 0) {
      return null
    }

    const sources: EnrichmentResult['sources'] = []
    const emails: Array<{
      email: string
      score: number
      position?: string
      department?: string
    }> = []

    for (const email of data.data.emails) {
      emails.push({
        email: email.value,
        score: email.score,
        position: email.position,
        department: email.department,
      })

      sources.push({
        field: 'email',
        source_url: 'https://hunter.io',
        snippet: `${email.value} (score: ${email.score})`,
        confidence: email.score / 100,
        verified_at: new Date().toISOString(),
      })
    }

    // Log API usage (Hunter.io costs $0.02 per verification)
    await logApiCall('hunter', 'domain_search', 0.02, true)

    return {
      data: {
        emails,
        organization: data.data.organization,
        pattern: data.data.pattern,
      },
      sources,
    }
  } catch (error) {
    console.error('Hunter.io enrichment error:', error)
    await logApiCall('hunter', 'domain_search', 0, false)
    return null
  }
}

export async function verifyEmailWithHunter(
  email: string
): Promise<{ valid: boolean; score: number; result: string }> {
  const apiKey = process.env.HUNTER_API_KEY

  if (!apiKey) {
    throw new Error('Hunter.io API key not configured')
  }

  try {
    const url = `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    await logApiCall('hunter', 'email_verifier', 0.02, true)

    return {
      valid: data.data.status === 'valid',
      score: data.data.score,
      result: data.data.result,
    }
  } catch (error) {
    console.error('Hunter.io email verification error:', error)
    await logApiCall('hunter', 'email_verifier', 0, false)
    throw error
  }
}

async function logApiCall(
  service: string,
  operation: string,
  cost: number,
  success: boolean
) {
  try {
    const { prisma } = await import('@/lib/db')
    await prisma.apiCallLog.create({
      data: {
        service,
        operation,
        cost,
        success,
        metadata: { timestamp: new Date().toISOString() },
      },
    })
  } catch (error) {
    console.error('Failed to log API call:', error)
  }
}