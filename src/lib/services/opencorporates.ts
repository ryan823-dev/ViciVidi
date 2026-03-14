/**
 * OpenCorporates API 服务
 * 全球最大的开放公司数据库，覆盖 2 亿+ 公司
 * 
 * 官网：https://opencorporates.com/
 * API 文档：https://api.opencorporates.com/
 * 
 * 免费功能：
 * - 搜索公司（每日限额）
 * - 获取公司基本信息
 * - 公司关联网络
 * 
 * 数据来源：
 * - 各国官方公司注册机构
 * - 政府公开数据
 * - 新闻和公告
 */

interface OpenCorporatesCompany {
  name: string
  company_number: string
  jurisdiction_code: string
  incorporation_date?: string
  dissolution_date?: string
  company_type?: string
  registry_url?: string
  branch?: string
  branch_status?: string
  current_status?: string
  created_at?: string
  source?: {
    publisher: string
    url: string
  }
  registered_address?: {
    street_address?: string
    locality?: string
    region?: string
    postal_code?: string
    country?: string
  }
  previous_names?: Array<{
    company_name: string
    start_date?: string
    end_date?: string
  }>
  officers?: Array<{
    name: string
    position: string
    start_date?: string
    end_date?: string
  }>
  industry_codes?: Array<{
    industry_code: string
    description?: string
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

const OPENCORPORATES_API = 'https://api.opencorporates.com/v0.4'

/**
 * 在 OpenCorporates 搜索公司
 */
export async function searchOpenCorporates(
  query: string,
  jurisdiction?: string
): Promise<OpenCorporatesCompany[] | null> {
  const apiKey = process.env.OPENCORPORATES_API_KEY

  try {
    let url = `${OPENCORPORATES_API}/companies/search?q=${encodeURIComponent(query)}`
    
    if (jurisdiction) {
      url += `&jurisdiction_code=${jurisdiction}`
    }

    // 如果有 API Key 可以提高限额
    if (apiKey) {
      url += `&api_token=${apiKey}`
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('OpenCorporates search error:', response.status)
      return null
    }

    const data = await response.json()
    return data.results?.companies?.map((c: any) => c.company) || []
  } catch (error) {
    console.error('OpenCorporates search error:', error)
    return null
  }
}

/**
 * 获取公司详细信息
 */
export async function getOpenCorporatesCompany(
  jurisdictionCode: string,
  companyNumber: string
): Promise<OpenCorporatesCompany | null> {
  const apiKey = process.env.OPENCORPORATES_API_KEY

  try {
    let url = `${OPENCORPORATES_API}/companies/${jurisdictionCode}/${companyNumber}`
    
    if (apiKey) {
      url += `?api_token=${apiKey}`
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.results?.company || null
  } catch (error) {
    console.error('OpenCorporates detail error:', error)
    return null
  }
}

/**
 * 从域名推断并查找公司
 */
export async function enrichFromOpenCorporates(
  domain: string,
  companyName?: string
): Promise<EnrichmentResult | null> {
  try {
    // 从域名提取公司名
    let searchQuery = companyName || domain
      .replace(/\.(com|co\.uk|io|net|org|ai|de|fr|jp|cn|in|au|ca)$/i, '')
      .replace(/www\./i, '')
      .replace(/-/g, ' ')
      .trim()

    // 搜索公司
    const companies = await searchOpenCorporates(searchQuery)

    if (!companies || companies.length === 0) {
      return null
    }

    // 找到最相关的公司
    const bestMatch = companies[0]

    // 获取详细信息
    const details = await getOpenCorporatesCompany(
      bestMatch.jurisdiction_code,
      bestMatch.company_number
    )

    const result: EnrichmentResult = {
      data: {},
      sources: []
    }

    const company = details || bestMatch
    const ocUrl = `https://opencorporates.com/companies/${company.jurisdiction_code}/${company.company_number}`

    // 公司名称
    if (company.name) {
      result.data.name = company.name
      result.sources.push({
        field: 'name',
        source_url: ocUrl,
        snippet: company.name,
        confidence: 0.85,
        verified_at: new Date().toISOString(),
      })
    }

    // 公司注册号
    if (company.company_number) {
      result.data.companyNumber = company.company_number
      result.data.registryId = company.company_number
    }

    // 管辖区（国家/地区）
    if (company.jurisdiction_code) {
      result.data.jurisdiction = company.jurisdiction_code
      result.data.country = getCountryFromJurisdiction(company.jurisdiction_code)
    }

    // 公司类型
    if (company.company_type) {
      result.data.companyType = company.company_type
    }

    // 成立日期
    if (company.incorporation_date) {
      result.data.foundedDate = company.incorporation_date
      result.data.incorporationDate = company.incorporation_date
      result.sources.push({
        field: 'foundedDate',
        source_url: ocUrl,
        snippet: company.incorporation_date,
        confidence: 0.9,
        verified_at: new Date().toISOString(),
      })
    }

    // 公司状态
    if (company.current_status) {
      result.data.companyStatus = company.current_status
    }

    // 注册地址
    if (company.registered_address) {
      const addr = company.registered_address
      const fullAddress = [
        addr.street_address,
        addr.locality,
        addr.region,
        addr.postal_code,
        addr.country
      ].filter(Boolean).join(', ')

      if (fullAddress) {
        result.data.address = fullAddress
        result.data.registeredAddress = fullAddress
      }
    }

    // 高管信息
    if (company.officers && company.officers.length > 0) {
      result.data.officers = company.officers.slice(0, 10).map(o => ({
        name: o.name,
        position: o.position,
        startDate: o.start_date,
      }))
      result.data.keyPeople = company.officers.slice(0, 5).map(o => o.name)
    }

    // 行业代码
    if (company.industry_codes && company.industry_codes.length > 0) {
      result.data.industryCodes = company.industry_codes.map(i => i.industry_code)
      if (company.industry_codes[0]?.description) {
        result.data.industry = company.industry_codes[0].description
      }
    }

    // 来源信息
    if (company.source) {
      result.data.dataSource = company.source.publisher
    }

    // OpenCorporates URL
    result.data.openCorporatesUrl = ocUrl
    result.data.companyRegistry = 'OpenCorporates'

    return result
  } catch (error) {
    console.error('OpenCorporates enrichment error:', error)
    return null
  }
}

/**
 * 获取公司的关联网络（子公司、母公司等）
 */
export async function getCompanyNetwork(
  jurisdictionCode: string,
  companyNumber: string
): Promise<Array<{
  name: string
  relationship: string
  jurisdiction: string
  companyNumber: string
}> | null> {
  const apiKey = process.env.OPENCORPORATES_API_KEY

  if (!apiKey) {
    return null // 需要 API Key
  }

  try {
    const url = `${OPENCORPORATES_API}/companies/${jurisdictionCode}/${companyNumber}/network?api_token=${apiKey}`

    const response = await fetch(url)

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    return data.results?.relationships?.map((r: any) => ({
      name: r.related_company?.name,
      relationship: r.relationship_type,
      jurisdiction: r.related_company?.jurisdiction_code,
      companyNumber: r.related_company?.company_number,
    })) || []
  } catch (error) {
    console.error('OpenCorporates network error:', error)
    return null
  }
}

/**
 * 根据管辖区代码获取国家名
 */
function getCountryFromJurisdiction(code: string): string {
  const countryMap: Record<string, string> = {
    'gb': 'United Kingdom',
    'us_de': 'Delaware, USA',
    'us_ca': 'California, USA',
    'us_ny': 'New York, USA',
    'us_tx': 'Texas, USA',
    'us_fl': 'Florida, USA',
    'de': 'Germany',
    'fr': 'France',
    'nl': 'Netherlands',
    'ie': 'Ireland',
    'lu': 'Luxembourg',
    'be': 'Belgium',
    'es': 'Spain',
    'it': 'Italy',
    'se': 'Sweden',
    'no': 'Norway',
    'dk': 'Denmark',
    'fi': 'Finland',
    'pl': 'Poland',
    'cz': 'Czech Republic',
    'at': 'Austria',
    'ch': 'Switzerland',
    'pt': 'Portugal',
    'gr': 'Greece',
    'jp': 'Japan',
    'kr': 'South Korea',
    'cn': 'China',
    'hk': 'Hong Kong',
    'sg': 'Singapore',
    'my': 'Malaysia',
    'th': 'Thailand',
    'in': 'India',
    'au': 'Australia',
    'nz': 'New Zealand',
    'ca': 'Canada',
    'mx': 'Mexico',
    'br': 'Brazil',
    'za': 'South Africa',
    'ae': 'United Arab Emirates',
    'il': 'Israel',
  }

  // 处理美国各州
  if (code.startsWith('us_')) {
    return countryMap[code] || 'United States'
  }

  return countryMap[code.toLowerCase()] || code.toUpperCase()
}

/**
 * 批量搜索公司（用于去重检测）
 */
export async function batchSearchOpenCorporates(
  queries: string[]
): Promise<Map<string, OpenCorporatesCompany[]>> {
  const results = new Map<string, OpenCorporatesCompany[]>()

  for (const query of queries) {
    const companies = await searchOpenCorporates(query)
    if (companies) {
      results.set(query, companies)
    }
    // 避免 API 限流
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  return results
}