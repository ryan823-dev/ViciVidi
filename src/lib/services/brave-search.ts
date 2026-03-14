/**
 * Brave Search API 服务
 * 搜索公司相关信息、新闻、公开邮箱等
 */

interface BraveSearchResult {
  title?: string
  url?: string
  description?: string
  snippet?: string
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

export interface BraveSearchResponse {
  results: Array<{
    title: string
    url: string
    snippet: string
  }>
}

/**
 * 通用搜索函数
 */
export async function braveSearch(
  query: string,
  options?: {
    count?: number
  }
): Promise<BraveSearchResponse> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY

  if (!apiKey) {
    console.warn('Brave Search API key not configured')
    return { results: [] }
  }

  try {
    const searchUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${options?.count || 10}`

    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey,
        'Accept-Encoding': 'gzip',
      },
    })

    const data = await response.json()

    if (!data.web?.results || data.web.results.length === 0) {
      return { results: [] }
    }

    return {
      results: data.web.results.map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.description,
      })),
    }
  } catch (error) {
    console.error('Brave Search error:', error)
    return { results: [] }
  }
}

export async function enrichFromBraveSearch(
  domain: string,
  query?: string
): Promise<EnrichmentResult | null> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY

  if (!apiKey) {
    console.warn('Brave Search API key not configured')
    return null
  }

  try {
    const searchQuery = query || `${domain} company information contact`
    const searchUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(searchQuery)}&count=10`

    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey,
        'Accept-Encoding': 'gzip',
      },
    })

    const data = await response.json()

    if (!data.web?.results || data.web.results.length === 0) {
      return null
    }

    const results: BraveSearchResult[] = data.web.results
    const sources: EnrichmentResult['sources'] = []
    const enrichData: Record<string, unknown> = {}

    // Extract potential emails from snippets
    const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const foundEmails: string[] = []

    for (const result of results) {
      sources.push({
        field: 'web_search',
        source_url: result.url || '',
        snippet: result.description || result.snippet || '',
        confidence: 0.7,
        verified_at: new Date().toISOString(),
      })

      // Extract emails
      if (result.description) {
        const emails = result.description.match(emailRegex)
        if (emails) {
          foundEmails.push(...emails)
        }
      }
    }

    if (foundEmails.length > 0) {
      enrichData.emails = [...new Set(foundEmails)]
    }

    // Log API usage
    await logApiCall('brave_search', 'web_search', 0.005, true)

    return {
      data: enrichData,
      sources,
    }
  } catch (error) {
    console.error('Brave Search enrichment error:', error)
    await logApiCall('brave_search', 'web_search', 0, false)
    return null
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