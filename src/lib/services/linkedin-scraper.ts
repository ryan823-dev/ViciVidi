/**
 * LinkedIn 公开数据抓取服务
 * 
 * 注意：LinkedIn 反爬虫严格，此服务使用公开页面 + 搜索技巧
 * 建议配合浏览器自动化使用
 */

export interface LinkedInCompany {
  name: string
  url: string
  industry?: string
  size?: string
  location?: string
  description?: string
  website?: string
  followers?: number
  employees?: LinkedInEmployee[]
}

export interface LinkedInEmployee {
  name: string
  title?: string
  profileUrl?: string
  duration?: string
}

/**
 * 通过 Google 搜索 LinkedIn 公司页面
 * 使用 site:linkedin.com/company 搜索
 */
export async function searchLinkedInCompanies(
  keywords: string,
  location?: string
): Promise<LinkedInCompany[]> {
  const { braveSearch } = await import('./brave-search')
  
  const query = [
    'site:linkedin.com/company',
    keywords,
    location ? location : '',
  ].filter(Boolean).join(' ')

  const result = await braveSearch(query, {
    count: 10,
  })

  return result.results.map(r => ({
    name: extractCompanyName(r.url),
    url: r.url,
    description: r.snippet,
  }))
}

/**
 * 从 LinkedIn URL 提取公司名
 */
function extractCompanyName(url: string): string {
  const match = url.match(/linkedin\.com\/company\/([^/]+)/)
  if (match) {
    return match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }
  return 'Unknown'
}

/**
 * 搜索公司决策人（通过 Google 搜索）
 */
export async function searchLinkedInPeople(
  companyName: string,
  titles?: string[]
): Promise<LinkedInEmployee[]> {
  const { braveSearch } = await import('./brave-search')
  
  const titleQuery = titles?.length 
    ? `(${titles.join(' OR ')})` 
    : '(CEO OR CTO OR CFO OR Founder OR VP OR Director)'
  
  const query = `site:linkedin.com/in "${companyName}" ${titleQuery}`
  
  const result = await braveSearch(query, {
    count: 20,
  })

  return result.results.map(r => ({
    name: extractPersonName(r.title),
    title: extractJobTitle(r.title),
    profileUrl: r.url,
  }))
}

/**
 * 从搜索结果标题提取人名
 */
function extractPersonName(title: string): string {
  const match = title.match(/^([^-]+) - /)
  if (match) {
    return match[1].trim()
  }
  return 'Unknown'
}

/**
 * 从搜索结果标题提取职位
 */
function extractJobTitle(title: string): string {
  const match = title.match(/- ([^-]+) at/)
  if (match) {
    return match[1].trim()
  }
  return 'Unknown'
}

/**
 * 获取公司基本信息（通过公开页面）
 */
export async function getLinkedInCompanyInfo(
  companyUrl: string
): Promise<LinkedInCompany | null> {
  try {
    // 注意：LinkedIn 需要登录才能查看完整信息
    // 这里只能获取非常有限的公开数据
    const response = await fetch(companyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      return null
    }

    const html = await response.text()
    
    // 提取基本信息（需要解析 HTML，比较复杂）
    // 这里简化处理，实际使用建议通过 API
    
    return {
      name: 'LinkedIn Company',
      url: companyUrl,
    }
  } catch (error) {
    console.error('LinkedIn scrape error:', error)
    return null
  }
}

/**
 * 生成 LinkedIn 搜索链接（供用户手动访问）
 */
export function generateLinkedInSearchUrl(
  keywords: string,
  options?: {
    location?: string
    industry?: string
    companySize?: string
  }
): string {
  const baseUrl = 'https://www.linkedin.com/search/results/companies/'
  
  const params = new URLSearchParams()
  
  if (keywords) {
    params.set('keywords', keywords)
  }
  
  if (options?.location) {
    params.set('geoUrn', options.location)
  }
  
  if (options?.companySize) {
    params.set('companySize', options.companySize)
  }
  
  return `${baseUrl}?${params.toString()}`
}

/**
 * 生成 LinkedIn 人员搜索链接
 */
export function generateLinkedInPeopleSearchUrl(
  companyName: string,
  titles?: string[]
): string {
  const baseUrl = 'https://www.linkedin.com/search/results/people/'
  
  const params = new URLSearchParams()
  params.set('keywords', `${companyName} ${titles?.join(' OR ') || 'CEO CTO Founder'}`)
  
  return `${baseUrl}?${params.toString()}`
}
