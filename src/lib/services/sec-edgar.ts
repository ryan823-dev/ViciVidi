/**
 * SEC EDGAR API 服务（美国证券交易委员会）
 * 官方免费 API，提供美国上市公司的公开披露数据
 * 文档：https://www.sec.gov/developer
 * 
 * 注意：SEC 要求请求时携带 User-Agent 标识
 */

interface SECCompany {
  cik: string
  name: string
  ticker: string
  exchange: string
  sic: string
  sicDescription: string
  ein: string
  description: string
  website: string
  investorWebsite: string
  category: string
  fiscalYearEnd: string
  stateOfIncorporation: string
  addresses: {
    mailing: { street1: string; street2: string; city: string; stateOrCountry: string; zipCode: string }
    business: { street1: string; street2: string; city: string; stateOrCountry: string; zipCode: string }
  }
  phone: string
  flags: string
}

interface SECCompanyTicker {
  cik_str: string
  ticker: string
  title: string
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

// SEC 要求的 User-Agent（使用应用名称和联系方式）
const USER_AGENT = 'ViciVidi AI contact@vicividi.ai'

/**
 * 搜索美国上市公司（通过股票代码或公司名）
 */
export async function searchUSCompany(
  query: string
): Promise<SECCompanyTicker[] | null> {
  try {
    // SEC 提供完整的公司股票代码列表
    const response = await fetch(
      'https://www.sec.gov/files/company_tickers.json',
      {
        headers: {
          'User-Agent': USER_AGENT,
        },
      }
    )

    if (!response.ok) {
      console.error('SEC tickers API error:', response.status)
      return null
    }

    const data = await response.json()
    
    // 搜索匹配的公司
    const results: SECCompanyTicker[] = []
    const queryLower = query.toLowerCase()

    for (const key of Object.keys(data)) {
      const company = data[key]
      if (
        company.ticker?.toLowerCase().includes(queryLower) ||
        company.title?.toLowerCase().includes(queryLower)
      ) {
        results.push(company)
      }
      if (results.length >= 10) break
    }

    return results
  } catch (error) {
    console.error('SEC search error:', error)
    return null
  }
}

/**
 * 获取美国上市公司详细信息
 */
export async function getUSCompanyDetails(
  cik: string
): Promise<SECCompany | null> {
  try {
    // CIK 需要补齐到 10 位
    const paddedCik = cik.padStart(10, '0')

    const response = await fetch(
      `https://data.sec.gov/submissions/CIK${paddedCik}.json`,
      {
        headers: {
          'User-Agent': USER_AGENT,
        },
      }
    )

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('SEC company detail error:', error)
    return null
  }
}

/**
 * 获取公司最新披露文件
 */
export async function getCompanyFilings(
  cik: string,
  filingType?: string
): Promise<any[] | null> {
  try {
    const paddedCik = cik.padStart(10, '0')

    const response = await fetch(
      `https://data.sec.gov/submissions/CIK${paddedCik}.json`,
      {
        headers: {
          'User-Agent': USER_AGENT,
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const filings = data.filings?.recent || []

    if (filingType) {
      return filings.filter((f: any) => f.form === filingType)
    }

    return filings.slice(0, 20) // 返回最近 20 份
  } catch (error) {
    console.error('SEC filings error:', error)
    return null
  }
}

/**
 * 从域名或股票代码查找美国上市公司
 */
export async function enrichFromSEC(
  domain: string,
  ticker?: string
): Promise<EnrichmentResult | null> {
  try {
    let companies: SECCompanyTicker[] | null = null

    // 如果提供了股票代码，直接搜索
    if (ticker) {
      companies = await searchUSCompany(ticker)
    }

    // 否则从域名推断
    if (!companies || companies.length === 0) {
      // 从域名提取可能的股票代码或公司名
      const domainQuery = domain
        .replace(/\.(com|io|net|org|ai)$/i, '')
        .replace(/www\./i, '')
        .replace(/-/g, ' ')
      
      companies = await searchUSCompany(domainQuery)
    }

    if (!companies || companies.length === 0) {
      return null
    }

    // 获取最匹配公司的详细信息
    const bestMatch = companies[0]
    const details = await getUSCompanyDetails(bestMatch.cik_str)

    if (!details) {
      return null
    }

    const result: EnrichmentResult = {
      data: {},
      sources: []
    }

    const baseUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${details.cik}`

    // 公司名称
    if (details.name) {
      result.data.name = details.name
      result.sources.push({
        field: 'name',
        source_url: baseUrl,
        snippet: details.name,
        confidence: 0.95,
        verified_at: new Date().toISOString(),
      })
    }

    // 股票代码
    if (bestMatch.ticker) {
      result.data.ticker = bestMatch.ticker
      result.data.stockSymbol = bestMatch.ticker
      result.sources.push({
        field: 'ticker',
        source_url: baseUrl,
        snippet: bestMatch.ticker,
        confidence: 0.95,
        verified_at: new Date().toISOString(),
      })
    }

    // 公司描述
    if (details.description) {
      result.data.description = details.description
      result.data.about = details.description
    }

    // 网站
    if (details.website) {
      result.data.website = details.website
    }

    // 行业分类
    if (details.sicDescription) {
      result.data.industry = details.sicDescription
      result.data.sicCode = details.sic
      result.sources.push({
        field: 'industry',
        source_url: baseUrl,
        snippet: details.sicDescription,
        confidence: 0.9,
        verified_at: new Date().toISOString(),
      })
    }

    // 公司类型
    if (details.category) {
      result.data.companyCategory = details.category
    }

    // 地址
    if (details.addresses?.business) {
      const addr = details.addresses.business
      const fullAddress = [
        addr.street1,
        addr.street2,
        addr.city,
        addr.stateOrCountry,
      ].filter(Boolean).join(', ')

      if (fullAddress) {
        result.data.address = fullAddress
        result.data.country = 'United States'
        result.data.state = addr.stateOrCountry
      }
    }

    // 电话
    if (details.phone) {
      result.data.phone = details.phone
      result.sources.push({
        field: 'phone',
        source_url: baseUrl,
        snippet: details.phone,
        confidence: 0.9,
        verified_at: new Date().toISOString(),
      })
    }

    // EIN（联邦税号）
    if (details.ein) {
      result.data.ein = details.ein
    }

    // 注册州
    if (details.stateOfIncorporation) {
      result.data.stateOfIncorporation = details.stateOfIncorporation
    }

    // 财年结束日期
    if (details.fiscalYearEnd) {
      result.data.fiscalYearEnd = details.fiscalYearEnd
    }

    // CIK
    result.data.cik = details.cik
    result.data.companyRegistry = 'SEC EDGAR (US)'

    // 标记为上市公司
    result.data.isPublic = true
    result.data.listingExchange = 'NASDAQ/NYSE'

    return result
  } catch (error) {
    console.error('SEC enrichment error:', error)
    return null
  }
}

/**
 * 获取公司财务数据（从 10-K 年报）
 */
export async function getCompanyFinancials(
  cik: string
): Promise<{
  revenue?: number
  employees?: number
  fiscalYearEnd?: string
} | null> {
  try {
    const filings = await getCompanyFilings(cik, '10-K')

    if (!filings || filings.length === 0) {
      return null
    }

    // 返回基本信息，详细财务数据需要解析 XBRL
    return {
      fiscalYearEnd: filings[0]?.reportDate,
    }
  } catch (error) {
    console.error('SEC financials error:', error)
    return null
  }
}