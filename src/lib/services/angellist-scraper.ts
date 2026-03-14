/**
 * AngelList (Wellfound) 初创企业数据
 * 
 * 发现融资中的初创公司
 * 找到创始人和投资人联系方式
 */

export interface AngelListCompany {
  id: string
  name: string
  url: string
  description?: string
  website?: string
  location?: string
  employeeCount?: number
  stage?: string
  totalFunding?: string
  lastFundingType?: string
  lastFundingAmount?: string
  industries?: string[]
  founders?: Founder[]
}

export interface Founder {
  id: string
  name: string
  title: string
  profileUrl?: string
  bio?: string
}

/**
 * 搜索初创公司（通过 Google 搜索）
 */
export async function searchAngelListCompanies(
  keywords?: string,
  location?: string,
  stage?: string
): Promise<AngelListCompany[]> {
  const { braveSearch } = await import('./brave-search')
  
  const query = [
    'site:wellfound.com OR site:angel.co/company',
    keywords || '',
    location ? `location:${location}` : '',
    stage ? `stage:${stage}` : '',
  ].filter(Boolean).join(' ')
  
  const result = await braveSearch(query, {
    count: 20,
  })
  
  return result.results.map(r => ({
    id: extractAngelListId(r.url),
    name: extractCompanyName(r.title),
    url: r.url,
    description: r.snippet,
  }))
}

/**
 * 从 URL 提取公司 ID
 */
function extractAngelListId(url: string): string {
  const match = url.match(/wellfound\.com\/company\/([^/]+)/)
  if (match) {
    return match[1]
  }
  return 'unknown'
}

/**
 * 从标题提取公司名
 */
function extractCompanyName(title: string): string {
  const match = title.match(/^([^|]+)/)
  if (match) {
    return match[1].trim()
  }
  return 'Unknown'
}

/**
 * 搜索特定行业的初创公司
 */
export async function searchByIndustry(
  industry: string,
  location?: string
): Promise<AngelListCompany[]> {
  const { braveSearch } = await import('./brave-search')
  
  const query = [
    'site:wellfound.com/company',
    industry,
    location ? location : '',
    '(seed OR series A OR series B)',
  ].filter(Boolean).join(' ')
  
  const result = await braveSearch(query, {
    count: 20,
  })
  
  return result.results.map(r => ({
    id: extractAngelListId(r.url),
    name: extractCompanyName(r.title),
    url: r.url,
    description: r.snippet,
  }))
}

/**
 * 搜索最近融资的公司
 */
export async function searchRecentlyFunded(
  months: number = 6,
  minAmount?: number
): Promise<AngelListCompany[]> {
  const { braveSearch } = await import('./brave-search')
  
  const query = [
    'site:wellfound.com/company',
    `raised funding in ${months} months`,
    minAmount ? `raised $${minAmount}M` : '',
  ].filter(Boolean).join(' ')
  
  const result = await braveSearch(query, {
    count: 20,
  })
  
  return result.results.map(r => ({
    id: extractAngelListId(r.url),
    name: extractCompanyName(r.title),
    url: r.url,
    description: r.snippet,
  }))
}

/**
 * 生成 AngelList 搜索链接
 */
export function generateAngelListSearchUrl(
  options?: {
    industry?: string
    location?: string
    stage?: string
    employees?: string
  }
): string {
  const baseUrl = 'https://wellfound.com/companies'
  
  const params = new URLSearchParams()
  
  if (options?.industry) {
    params.set('industry', options.industry)
  }
  
  if (options?.location) {
    params.set('location', options.location)
  }
  
  if (options?.stage) {
    params.set('stage', options.stage)
  }
  
  if (options?.employees) {
    params.set('employees', options.employees)
  }
  
  return `${baseUrl}?${params.toString()}`
}

/**
 * 获取公司详情（需要登录，简化版）
 */
export async function getCompanyDetails(
  companyUrl: string
): Promise<AngelListCompany | null> {
  try {
    // AngelList 需要登录才能查看完整信息
    // 这里只能通过 Google 搜索获取有限信息
    
    const { braveSearch } = await import('./brave-search')
    
    // 搜索公司的其他信息
    const domain = extractDomainFromUrl(companyUrl)
    if (domain) {
      const searchResult = await braveSearch(`"${domain}" funding team`, {
        count: 5,
      })
      
      return {
        id: extractAngelListId(companyUrl),
        name: extractCompanyName(companyUrl),
        url: companyUrl,
        website: domain,
        description: searchResult.results[0]?.snippet,
      }
    }
    
    return null
  } catch (error) {
    console.error('AngelList details error:', error)
    return null
  }
}

/**
 * 从 URL 提取域名
 */
function extractDomainFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return null
  }
}
