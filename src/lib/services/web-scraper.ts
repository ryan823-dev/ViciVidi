/**
 * 网页抓取器服务
 * 自建抓取器，抓取官网关键页面
 * 
 * 抓取策略：
 * 1. 首页 - 公司基本信息、标语
 * 2. About/Team - 团队信息、公司历史
 * 3. Products/Services - 产品信息
 * 4. Pricing - 定价信息（重要信号）
 * 5. Careers - 招聘信息（增长信号）
 * 6. Contact - 联系方式
 * 7. Blog/News - 最新动态
 */

interface ScrapedPage {
  url: string
  title: string
  content: string
  links: string[]
  emails: string[]
  phones: string[]
  socialLinks: {
    linkedin?: string
    twitter?: string
    facebook?: string
    github?: string
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

// 关键页面路径
const KEY_PAGES = [
  { path: '/', priority: 1, type: 'homepage' },
  { path: '/about', priority: 2, type: 'about' },
  { path: '/about-us', priority: 2, type: 'about' },
  { path: '/team', priority: 2, type: 'team' },
  { path: '/products', priority: 2, type: 'products' },
  { path: '/services', priority: 2, type: 'services' },
  { path: '/pricing', priority: 3, type: 'pricing' },
  { path: '/careers', priority: 3, type: 'careers' },
  { path: '/contact', priority: 3, type: 'contact' },
  { path: '/blog', priority: 4, type: 'blog' },
  { path: '/news', priority: 4, type: 'news' },
]

/**
 * 抓取单个页面
 */
export async function scrapePage(url: string): Promise<ScrapedPage | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ViciVidiBot/1.0; +https://vicividi.ai/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000), // 10秒超时
    })

    if (!response.ok) {
      return null
    }

    const html = await response.text()
    
    return parseHtml(url, html)
  } catch (error) {
    console.error(`Scrape error for ${url}:`, error)
    return null
  }
}

/**
 * 解析 HTML 提取信息
 */
function parseHtml(url: string, html: string): ScrapedPage {
  // 提取标题
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : ''

  // 提取正文内容（移除脚本、样式）
  let content = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 5000) // 限制长度

  // 提取链接
  const links: string[] = []
  const linkMatches = html.matchAll(/href=["']([^"']+)["']/gi)
  for (const match of linkMatches) {
    const href = match[1]
    if (href.startsWith('/') || href.startsWith(url) || href.startsWith('https://') || href.startsWith('http://')) {
      links.push(href)
    }
  }

  // 提取邮箱
  const emails: string[] = []
  const emailMatches = html.matchAll(/[\w.-]+@[\w.-]+\.\w+/g)
  for (const match of emailMatches) {
    const email = match[0].toLowerCase()
    // 排除常见的无关邮箱
    if (!email.includes('example.com') && 
        !email.includes('domain.com') && 
        !email.includes('email.com') &&
        !email.includes('yourcompany')) {
      emails.push(email)
    }
  }

  // 提取电话
  const phones: string[] = []
  const phoneMatches = html.matchAll(/\+?[\d\s()-]{10,}/g)
  for (const match of phoneMatches) {
    const phone = match[0].trim()
    if (phone.replace(/\D/g, '').length >= 10) {
      phones.push(phone)
    }
  }

  // 提取社交链接
  const socialLinks: ScrapedPage['socialLinks'] = {}
  
  if (html.includes('linkedin.com')) {
    const linkedinMatch = html.match(/linkedin\.com\/company\/([^"'\s]+)/i)
    if (linkedinMatch) {
      socialLinks.linkedin = `https://linkedin.com/company/${linkedinMatch[1]}`
    }
  }
  
  if (html.includes('twitter.com') || html.includes('x.com')) {
    const twitterMatch = html.match(/(?:twitter|x)\.com\/([^"'\s]+)/i)
    if (twitterMatch && !twitterMatch[1].includes('share')) {
      socialLinks.twitter = `https://twitter.com/${twitterMatch[1]}`
    }
  }

  return {
    url,
    title,
    content,
    links: [...new Set(links)].slice(0, 50),
    emails: [...new Set(emails)],
    phones: [...new Set(phones)],
    socialLinks,
  }
}

/**
 * 智能抓取公司网站
 */
export async function enrichFromWebScraper(
  domain: string
): Promise<EnrichmentResult | null> {
  try {
    // 标准化域名
    let baseUrl = domain.startsWith('http') ? domain : `https://${domain}`
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1)
    }

    const result: EnrichmentResult = {
      data: {},
      sources: []
    }

    // 首先抓取首页
    const homepage = await scrapePage(baseUrl)
    if (!homepage) {
      // 尝试 http
      const httpHomepage = await scrapePage(baseUrl.replace('https://', 'http://'))
      if (!httpHomepage) {
        return null
      }
      result.data = extractHomepageData(httpHomepage)
      result.sources = extractSources(baseUrl, 'homepage', homepage)
      return result
    }

    // 从首页提取基本数据
    Object.assign(result.data, extractHomepageData(homepage))
    result.sources = extractSources(baseUrl, 'homepage', homepage)

    // 并行抓取其他关键页面
    const pagePromises: Promise<{ page: ScrapedPage; type: string } | null>[] = []

    for (const keyPage of KEY_PAGES.slice(1, 5)) { // 只抓取前4个优先页面
      const url = `${baseUrl}${keyPage.path}`
      pagePromises.push(
        scrapePage(url).then(page => page ? { page, type: keyPage.type } : null)
      )
    }

    const pages = await Promise.all(pagePromises)

    // 合并各页面数据
    for (const pageResult of pages) {
      if (!pageResult) continue

      const { page, type } = pageResult

      switch (type) {
        case 'about':
          Object.assign(result.data, extractAboutData(page))
          result.sources.push(...extractSources(baseUrl + '/about', 'about', page))
          break

        case 'pricing':
          Object.assign(result.data, extractPricingData(page))
          result.sources.push(...extractSources(baseUrl + '/pricing', 'pricing', page))
          break

        case 'careers':
          Object.assign(result.data, extractCareersData(page))
          result.sources.push(...extractSources(baseUrl + '/careers', 'careers', page))
          break

        case 'contact':
          Object.assign(result.data, extractContactData(page))
          result.sources.push(...extractSources(baseUrl + '/contact', 'contact', page))
          break
      }
    }

    // 合并邮箱（去重）
    const allEmails = new Set<string>()
    if (homepage.emails.length > 0) {
      homepage.emails.forEach(e => allEmails.add(e))
    }
    pages.forEach(p => p?.page.emails.forEach(e => allEmails.add(e)))

    if (allEmails.size > 0) {
      // 找到最可能的联系邮箱
      const contactEmails = [...allEmails].filter(e => 
        e.includes('contact') || 
        e.includes('info') || 
        e.includes('hello') ||
        e.includes('support')
      )
      result.data.emails = [...allEmails]
      if (contactEmails.length > 0) {
        result.data.email = contactEmails[0]
      } else if (allEmails.size > 0) {
        result.data.email = [...allEmails][0]
      }
    }

    // 合并社交媒体
    if (homepage.socialLinks.linkedin) {
      result.data.linkedin = homepage.socialLinks.linkedin
    }
    if (homepage.socialLinks.twitter) {
      result.data.twitter = homepage.socialLinks.twitter
    }

    return result
  } catch (error) {
    console.error('Web scraper enrichment error:', error)
    return null
  }
}

/**
 * 从首页提取数据
 */
function extractHomepageData(page: ScrapedPage): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  // 标题通常是公司名或标语
  if (page.title) {
    data.companyName = page.title.split('|')[0].split('-')[0].trim()
  }

  // 提取描述（从 meta）
  // 由于我们只有 HTML，尝试从内容推断

  // 提取电话
  if (page.phones.length > 0) {
    data.phone = page.phones[0]
  }

  return data
}

/**
 * 从 About 页面提取数据
 */
function extractAboutData(page: ScrapedPage): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  const content = page.content.toLowerCase()

  // 尝试提取成立年份
  const foundedMatch = content.match(/(?:founded|established|since)\s+(\d{4})/i)
  if (foundedMatch) {
    data.foundedYear = parseInt(foundedMatch[1])
  }

  // 尝试提取员工规模
  const employeesMatch = content.match(/(\d+[\d,]*)\+?\s*(?:employees|team members|people)/i)
  if (employeesMatch) {
    data.employeeCount = parseInt(employeesMatch[1].replace(/,/g, ''))
  }

  return data
}

/**
 * 从 Pricing 页面提取数据
 */
function extractPricingData(page: ScrapedPage): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  const content = page.content

  // 提取价格信息
  const priceMatches = content.match(/\$(\d+)(?:\/mo|\/month)?/gi)
  if (priceMatches && priceMatches.length > 0) {
    data.hasPricingPage = true
    data.pricePoints = priceMatches.slice(0, 5)
  }

  return data
}

/**
 * 从 Careers 页面提取数据
 */
function extractCareersData(page: ScrapedPage): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  // 检测是否有招聘页面
  data.hasCareersPage = true

  const content = page.content.toLowerCase()

  // 统计职位数量（简单估算）
  const jobKeywords = ['engineer', 'manager', 'developer', 'designer', 'analyst', 'specialist']
  let jobCount = 0
  for (const keyword of jobKeywords) {
    const regex = new RegExp(keyword, 'gi')
    const matches = content.match(regex)
    if (matches) {
      jobCount += matches.length
    }
  }
  data.approximateJobOpenings = Math.min(jobCount, 50)

  return data
}

/**
 * 从 Contact 页面提取数据
 */
function extractContactData(page: ScrapedPage): Record<string, unknown> {
  const data: Record<string, unknown> = {}

  // 提取联系邮箱
  if (page.emails.length > 0) {
    data.contactEmails = page.emails
  }

  // 提取电话
  if (page.phones.length > 0) {
    data.contactPhones = page.phones
  }

  return data
}

/**
 * 生成来源信息
 */
function extractSources(
  url: string,
  type: string,
  page: ScrapedPage | null
): EnrichmentResult['sources'] {
  if (!page) return []

  return [{
    field: type,
    source_url: url,
    snippet: page.title || page.content.substring(0, 100),
    confidence: 0.8,
    verified_at: new Date().toISOString(),
  }]
}