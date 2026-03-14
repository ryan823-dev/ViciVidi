/**
 * Companies House API 服务（英国公司注册局）
 * 官方免费 API，提供英国公司的实时数据
 * 文档：https://developer.company-information.service.gov.uk/
 */

interface CompaniesHouseCompany {
  company_number: string
  company_name: string
  company_status: string
  type: string
  date_of_creation: string
  registered_office_address: {
    address_line_1?: string
    address_line_2?: string
    locality?: string
    postal_code?: string
    country?: string
  }
  sic_codes?: string[]
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

/**
 * 通过公司名称或编号搜索英国公司
 */
export async function searchUKCompany(
  query: string
): Promise<CompaniesHouseCompany[] | null> {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY

  if (!apiKey) {
    console.warn('Companies House API key not configured')
    return null
  }

  try {
    // Companies House 使用 Basic Auth
    const credentials = Buffer.from(`${apiKey}:`).toString('base64')
    
    const response = await fetch(
      `https://api.company-information.service.gov.uk/search/companies?q=${encodeURIComponent(query)}&items_per_page=5`,
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error('Companies House API error:', response.status)
      return null
    }

    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error('Companies House search error:', error)
    return null
  }
}

/**
 * 获取英国公司详细信息
 */
export async function getUKCompanyDetails(
  companyNumber: string
): Promise<CompaniesHouseCompany | null> {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY

  if (!apiKey) {
    return null
  }

  try {
    const credentials = Buffer.from(`${apiKey}:`).toString('base64')
    
    const response = await fetch(
      `https://api.company-information.service.gov.uk/company/${companyNumber}`,
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Companies House detail error:', error)
    return null
  }
}

/**
 * 从域名推断并查找英国公司
 */
export async function enrichFromCompaniesHouse(
  domain: string,
  companyName?: string
): Promise<EnrichmentResult | null> {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY

  if (!apiKey) {
    return null
  }

  try {
    // 从域名提取公司名（移除常见后缀）
    let searchQuery = companyName || domain.replace(/\.(com|co\.uk|io|net|org|ai)$/i, '')
    
    // 清理搜索词
    searchQuery = searchQuery
      .replace(/-/g, ' ')
      .replace(/www\./i, '')
      .trim()

    const companies = await searchUKCompany(searchQuery)

    if (!companies || companies.length === 0) {
      return null
    }

    // 找到最匹配的公司
    const bestMatch = companies[0]
    const details = await getUKCompanyDetails(bestMatch.company_number)

    if (!details) {
      return null
    }

    const result: EnrichmentResult = {
      data: {},
      sources: []
    }

    // 公司名称
    if (details.company_name) {
      result.data.name = details.company_name
      result.sources.push({
        field: 'name',
        source_url: `https://find-and-update.company-information.service.gov.uk/company/${details.company_number}`,
        snippet: details.company_name,
        confidence: 0.95,
        verified_at: new Date().toISOString(),
      })
    }

    // 公司状态
    if (details.company_status) {
      result.data.companyStatus = details.company_status
      result.sources.push({
        field: 'companyStatus',
        source_url: `https://find-and-update.company-information.service.gov.uk/company/${details.company_number}`,
        snippet: details.company_status,
        confidence: 0.95,
        verified_at: new Date().toISOString(),
      })
    }

    // 公司类型
    if (details.type) {
      result.data.companyType = getCompanyTypeLabel(details.type)
    }

    // 成立日期
    if (details.date_of_creation) {
      result.data.foundedDate = details.date_of_creation
      result.sources.push({
        field: 'foundedDate',
        source_url: `https://find-and-update.company-information.service.gov.uk/company/${details.company_number}`,
        snippet: details.date_of_creation,
        confidence: 0.95,
        verified_at: new Date().toISOString(),
      })
    }

    // 注册地址
    if (details.registered_office_address) {
      const addr = details.registered_office_address
      const fullAddress = [
        addr.address_line_1,
        addr.address_line_2,
        addr.locality,
        addr.postal_code,
        addr.country
      ].filter(Boolean).join(', ')

      if (fullAddress) {
        result.data.address = fullAddress
        result.data.country = addr.country || 'United Kingdom'
        result.sources.push({
          field: 'address',
          source_url: `https://find-and-update.company-information.service.gov.uk/company/${details.company_number}`,
          snippet: fullAddress,
          confidence: 0.95,
          verified_at: new Date().toISOString(),
        })
      }
    }

    // SIC 代码（行业分类）
    if (details.sic_codes && details.sic_codes.length > 0) {
      result.data.sicCodes = details.sic_codes
      result.data.industry = getSICDescription(details.sic_codes[0])
    }

    // 公司编号
    result.data.companyNumber = details.company_number
    result.data.companyRegistry = 'Companies House (UK)'

    return result
  } catch (error) {
    console.error('Companies House enrichment error:', error)
    return null
  }
}

/**
 * 获取公司类型标签
 */
function getCompanyTypeLabel(type: string): string {
  const types: Record<string, string> = {
    'ltd': 'Private Limited Company',
    'plc': 'Public Limited Company',
    'llp': 'Limited Liability Partnership',
    'lp': 'Limited Partnership',
    'charitable-incorporated-organisation': 'Charitable Incorporated Organisation',
    'private-unlimited': 'Private Unlimited Company',
    'private-limited-guarant-nsc': 'Private Limited by Guarantee',
  }
  return types[type] || type
}

/**
 * 获取 SIC 行业描述
 */
function getSICDescription(sicCode: string): string {
  // 简化版，实际应该查询完整的 SIC 代码表
  const prefixes: Record<string, string> = {
    '01': 'Agriculture',
    '02': 'Forestry',
    '10': 'Food Products',
    '11': 'Beverages',
    '12': 'Tobacco',
    '13': 'Textiles',
    '20': 'Chemicals',
    '25': 'Metal Products',
    '26': 'Electronics',
    '27': 'Electrical Equipment',
    '28': 'Machinery',
    '29': 'Motor Vehicles',
    '30': 'Other Transport',
    '31': 'Furniture',
    '32': 'Other Manufacturing',
    '33': 'Repair Services',
    '35': 'Electricity/Gas',
    '36': 'Water',
    '41': 'Construction',
    '45': 'Motor Trade',
    '46': 'Wholesale',
    '47': 'Retail',
    '49': 'Transport',
    '51': 'Air Transport',
    '52': 'Warehousing',
    '55': 'Accommodation',
    '56': 'Food Services',
    '58': 'Publishing',
    '59': 'Media',
    '60': 'Broadcasting',
    '61': 'Telecommunications',
    '62': 'IT Services',
    '63': 'Information Services',
    '64': 'Financial Services',
    '65': 'Insurance',
    '66': 'Financial Advisory',
    '68': 'Real Estate',
    '69': 'Legal Services',
    '70': 'Management Consulting',
    '71': 'Architecture/Engineering',
    '72': 'Scientific Research',
    '73': 'Advertising/Marketing',
    '74': 'Other Professional Services',
    '75': 'Veterinary',
    '77': 'Rental Services',
    '78': 'Employment Services',
    '79': 'Travel Agency',
    '80': 'Security Services',
    '81': 'Facility Services',
    '82': 'Office Support',
    '85': 'Education',
    '86': 'Healthcare',
    '87': 'Residential Care',
    '88': 'Social Work',
    '90': 'Creative Arts',
    '91': 'Libraries/Museums',
    '92': 'Gambling',
    '93': 'Sports/Recreation',
    '94': 'Membership Organizations',
    '95': 'Repair Services',
    '96': 'Personal Services',
    '97': 'Household Services',
    '98': 'Other Services',
    '99': 'Extraterritorial',
  }

  const prefix = sicCode.substring(0, 2)
  return prefixes[prefix] || 'Other'
}