/**
 * Firecrawl API 服务
 * 用于复杂站点的网页抓取，作为自建抓取器的兜底方案
 * 
 * 文档：https://www.firecrawl.dev/
 * 计费：Scrape/Crawl 1页=1credit，Search 2credits/10results
 * 
 * 使用场景：
 * - 自建抓取器失败的站点
 * - 需要渲染 JavaScript 的站点
 * - 复杂的反爬虫站点
 */

interface FirecrawlScrapeResult {
  success: boolean
  data?: {
    markdown?: string
    html?: string
    metadata?: {
      title?: string
      description?: string
      language?: string
      sourceURL?: string
    }
    links?: string[]
    emails?: string[]
    phones?: string[]
  }
  error?: string
}

interface FirecrawlSearchResult {
  success: boolean
  data?: Array<{
    url: string
    title: string
    description: string
    markdown: string
  }>
  error?: string
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

const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1'

/**
 * 使用 Firecrawl 抓取单个页面
 */
export async function scrapeWithFirecrawl(
  url: string
): Promise<FirecrawlScrapeResult | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY

  if (!apiKey) {
    console.warn('Firecrawl API key not configured')
    return null
  }

  try {
    const response = await fetch(`${FIRECRAWL_API_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        actions: [
          {
            type: 'wait',
            milliseconds: 2000,
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error('Firecrawl scrape error:', response.status)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Firecrawl scrape error:', error)
    return null
  }
}

/**
 * 使用 Firecrawl 搜索公司信息
 */
export async function searchWithFirecrawl(
  query: string
): Promise<FirecrawlSearchResult | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY

  if (!apiKey) {
    return null
  }

  try {
    const response = await fetch(`${FIRECRAWL_API_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        maxResults: 10,
      }),
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Firecrawl search error:', error)
    return null
  }
}

/**
 * 使用 Firecrawl 爬取整个网站
 */
export async function crawlWithFirecrawl(
  url: string,
  maxPages: number = 10
): Promise<string | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY

  if (!apiKey) {
    return null
  }

  try {
    // 启动爬取任务
    const response = await fetch(`${FIRECRAWL_API_URL}/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        maxDepth: 2,
        limit: maxPages,
        allowExternalLinks: false,
      }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.id // 返回任务 ID
  } catch (error) {
    console.error('Firecrawl crawl error:', error)
    return null
  }
}

/**
 * 使用 Firecrawl 作为兜底方案丰富公司数据
 */
export async function enrichFromFirecrawl(
  domain: string
): Promise<EnrichmentResult | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY

  if (!apiKey) {
    return null
  }

  try {
    const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`

    // 先抓取首页
    const scrapeResult = await scrapeWithFirecrawl(baseUrl)

    if (!scrapeResult?.success || !scrapeResult.data) {
      return null
    }

    const result: EnrichmentResult = {
      data: {},
      sources: []
    }

    // 提取元数据
    if (scrapeResult.data.metadata) {
      const { title, description } = scrapeResult.data.metadata

      if (title) {
        result.data.name = title.split('|')[0].split('-')[0].trim()
        result.sources.push({
          field: 'name',
          source_url: baseUrl,
          snippet: title,
          confidence: 0.85,
          verified_at: new Date().toISOString(),
        })
      }

      if (description) {
        result.data.description = description
      }
    }

    // 提取邮箱
    if (scrapeResult.data.emails && scrapeResult.data.emails.length > 0) {
      result.data.emails = scrapeResult.data.emails
      // 找到最可能的联系邮箱
      const contactEmails = scrapeResult.data.emails.filter((e: string) =>
        e.includes('contact') ||
        e.includes('info') ||
        e.includes('hello') ||
        e.includes('support')
      )
      result.data.email = contactEmails[0] || scrapeResult.data.emails[0]
    }

    // 提取电话
    if (scrapeResult.data.phones && scrapeResult.data.phones.length > 0) {
      result.data.phone = scrapeResult.data.phones[0]
      result.data.phones = scrapeResult.data.phones
    }

    // 从 markdown 内容提取更多信息
    if (scrapeResult.data.markdown) {
      const markdown = scrapeResult.data.markdown.toLowerCase()

      // 提取成立年份
      const foundedMatch = markdown.match(/(?:founded|established|since)\s+(\d{4})/i)
      if (foundedMatch) {
        result.data.foundedYear = parseInt(foundedMatch[1])
      }

      // 检测关键词
      const keywords = ['pricing', 'enterprise', 'startup', 'smb']
      for (const keyword of keywords) {
        if (markdown.includes(keyword)) {
          result.data[`${keyword}Mentioned`] = true
        }
      }
    }

    // 记录 API 调用
    await logFirecrawlCall('scrape', baseUrl, true)

    return result
  } catch (error) {
    console.error('Firecrawl enrichment error:', error)
    await logFirecrawlCall('enrich', domain, false)
    return null
  }
}

/**
 * 使用 Firecrawl 搜索并丰富数据
 */
export async function searchAndEnrichWithFirecrawl(
  companyName: string
): Promise<EnrichmentResult | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY

  if (!apiKey) {
    return null
  }

  try {
    const searchResult = await searchWithFirecrawl(`${companyName} company contact`)

    if (!searchResult?.success || !searchResult.data || searchResult.data.length === 0) {
      return null
    }

    const result: EnrichmentResult = {
      data: {},
      sources: []
    }

    // 取第一个搜索结果
    const topResult = searchResult.data[0]

    result.data.website = topResult.url
    result.data.description = topResult.description

    result.sources.push({
      field: 'search',
      source_url: topResult.url,
      snippet: topResult.title,
      confidence: 0.75,
      verified_at: new Date().toISOString(),
    })

    await logFirecrawlCall('search', companyName, true)

    return result
  } catch (error) {
    console.error('Firecrawl search error:', error)
    return null
  }
}

/**
 * 记录 Firecrawl API 调用
 */
async function logFirecrawlCall(
  operation: string,
  target: string,
  success: boolean
) {
  try {
    const { prisma } = await import('@/lib/db')
    await prisma.apiCallLog.create({
      data: {
        service: 'firecrawl',
        operation,
        cost: operation === 'search' ? 2 : 1, // Search = 2 credits
        success,
        metadata: { target, timestamp: new Date().toISOString() },
      },
    })
  } catch (error) {
    console.error('Failed to log Firecrawl call:', error)
  }
}