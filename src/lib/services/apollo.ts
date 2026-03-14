/**
 * Apollo.io API 服务
 * 性价比最高的公司+联系人一体化数据服务
 * 
 * 官网：https://www.apollo.io/
 * API 文档：https://developer.apollo.io/
 * 
 * 定价（2025）：
 * - 免费计划：50 次/月
 * - Basic：$49/月，500 次
 * - Professional：$99/月，2,000 次
 * - Organization：$149/月，5,000 次
 * 
 * 特点：
 * - 准确率：88%
 * - 公司+联系人一体化
 * - 技术栈信息
 * - 意图信号
 */

interface ApolloCompany {
  id: string
  name: string
  website_url?: string
  blog_url?: string
  angellist_url?: string
  linkedin_url?: string
  twitter_url?: string
  facebook_url?: string
  primary_phone?: {
    number: string
    source: string
  }
  primary_domain?: string
  owned_by_organization_id?: string
  founded_year?: number
  is_public?: boolean
  stock_exchange?: string
  stock_symbol?: string
  industry?: string
  industry_id?: string
  subindustry?: string
  subindustry_id?: string
  employee_count?: number
  estimated_num_employees?: number
  annual_revenue?: number
  total_funding?: number
  latest_funding_round_date?: string
  latest_funding_stage?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  street_address?: string
  description?: string
  seo_description?: string
  technologies?: string[]
  keywords?: string[]
}

interface ApolloContact {
  id: string
  first_name?: string
  last_name?: string
  name?: string
  email?: string
  title?: string
  headline?: string
  phone_numbers?: Array<{
    number: string
    type: string
  }>
  linkedin_url?: string
  organization_id?: string
  organization_name?: string
  departments?: string[]
  seniority?: string
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

const APOLLO_API = 'https://api.apollo.io/v1'

/**
 * 通过域名搜索公司
 */
export async function searchCompanyFromApollo(
  domain: string
): Promise<ApolloCompany | null> {
  const { getApiKey } = await import('@/lib/api-keys')
  const { apiKey } = await getApiKey('apollo', 'default')

  if (!apiKey) {
    console.warn('Apollo API key not configured')
    return null
  }

  try {
    const response = await fetch(`${APOLLO_API}/organizations/enrich`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
      },
      body: JSON.stringify({
        domain,
      }),
    })

    if (!response.ok) {
      console.error('Apollo company search error:', response.status)
      return null
    }

    const data = await response.json()
    return data.organization || null
  } catch (error) {
    console.error('Apollo search error:', error)
    return null
  }
}

/**
 * 批量搜索公司
 */
export async function batchSearchCompaniesFromApollo(
  domains: string[]
): Promise<ApolloCompany[]> {
  const { getApiKey } = await import('@/lib/api-keys')
  const { apiKey } = await getApiKey('apollo', 'default')

  if (!apiKey) {
    return []
  }

  try {
    const response = await fetch(`${APOLLO_API}/organizations/bulk_enrich`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
      },
      body: JSON.stringify({
        domains,
      }),
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.organizations || []
  } catch (error) {
    console.error('Apollo batch search error:', error)
    return []
  }
}

/**
 * 搜索公司联系人
 */
export async function searchContactsFromApollo(
  organizationId: string,
  options?: {
    titles?: string[]
    seniorities?: string[]
    departments?: string[]
    limit?: number
  }
): Promise<ApolloContact[]> {
  const apiKey = process.env.APOLLO_API_KEY

  if (!apiKey) {
    return []
  }

  try {
    const response = await fetch(`${APOLLO_API}/mixed_people/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
      },
      body: JSON.stringify({
        organization_ids: [organizationId],
        person_titles: options?.titles || [],
        person_seniorities: options?.seniorities || [],
        person_department_or_subdepartment_ids: options?.departments || [],
        page_size: options?.limit || 10,
      }),
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.people || []
  } catch (error) {
    console.error('Apollo contacts search error:', error)
    return []
  }
}

/**
 * 使用 Apollo 丰富公司数据
 */
export async function enrichFromApollo(
  domain: string
): Promise<EnrichmentResult | null> {
  const apiKey = process.env.APOLLO_API_KEY

  if (!apiKey) {
    return null
  }

  try {
    const company = await searchCompanyFromApollo(domain)

    if (!company) {
      return null
    }

    const result: EnrichmentResult = {
      data: {},
      sources: []
    }

    const apolloUrl = `https://app.apollo.io/#/companies/${company.id}`

    // 公司名称
    if (company.name) {
      result.data.name = company.name
      result.sources.push({
        field: 'name',
        source_url: apolloUrl,
        snippet: company.name,
        confidence: 0.9,
        verified_at: new Date().toISOString(),
      })
    }

    // 网站
    if (company.website_url) {
      result.data.website = company.website_url
    }

    // 主要域名
    if (company.primary_domain) {
      result.data.primaryDomain = company.primary_domain
    }

    // 行业
    if (company.industry) {
      result.data.industry = company.industry
      result.sources.push({
        field: 'industry',
        source_url: apolloUrl,
        snippet: company.industry,
        confidence: 0.9,
        verified_at: new Date().toISOString(),
      })
    }

    // 子行业
    if (company.subindustry) {
      result.data.subindustry = company.subindustry
    }

    // 员工数
    if (company.employee_count || company.estimated_num_employees) {
      result.data.employeeCount = company.employee_count || company.estimated_num_employees
      result.data.companySize = getCompanySizeLabel(result.data.employeeCount as number)
    }

    // 年收入
    if (company.annual_revenue) {
      result.data.annualRevenue = company.annual_revenue
      result.data.revenue = formatRevenue(company.annual_revenue)
    }

    // 总融资
    if (company.total_funding) {
      result.data.totalFunding = company.total_funding
      result.data.latestFundingStage = company.latest_funding_stage
    }

    // 成立年份
    if (company.founded_year) {
      result.data.foundedYear = company.founded_year
    }

    // 上市公司信息
    if (company.is_public) {
      result.data.isPublic = true
      if (company.stock_symbol) {
        result.data.stockSymbol = company.stock_symbol
      }
    }

    // 地址
    const address = [
      company.street_address,
      company.city,
      company.state,
      company.postal_code,
      company.country
    ].filter(Boolean).join(', ')

    if (address) {
      result.data.address = address
      result.data.city = company.city
      result.data.state = company.state
      result.data.country = company.country
    }

    // 电话
    if (company.primary_phone?.number) {
      result.data.phone = company.primary_phone.number
      result.sources.push({
        field: 'phone',
        source_url: apolloUrl,
        snippet: company.primary_phone.number,
        confidence: 0.85,
        verified_at: new Date().toISOString(),
      })
    }

    // 描述
    if (company.description) {
      result.data.description = company.description
      result.data.about = company.description
    }

    // 技术栈（重要！）
    if (company.technologies && company.technologies.length > 0) {
      result.data.technologies = company.technologies.slice(0, 20)
      result.data.techStack = company.technologies.slice(0, 10)
    }

    // 关键词
    if (company.keywords && company.keywords.length > 0) {
      result.data.keywords = company.keywords.slice(0, 10)
    }

    // 社交链接
    if (company.linkedin_url) {
      result.data.linkedin = company.linkedin_url
    }
    if (company.twitter_url) {
      result.data.twitter = company.twitter_url
    }
    if (company.facebook_url) {
      result.data.facebook = company.facebook_url
    }

    // Apollo ID
    result.data.apolloId = company.id
    result.data.apolloUrl = apolloUrl
    result.data.dataSource = 'Apollo.io'

    // 记录 API 调用
    await logApolloCall('organization_enrich', domain, true)

    return result
  } catch (error) {
    console.error('Apollo enrichment error:', error)
    await logApolloCall('enrich', domain, false)
    return null
  }
}

/**
 * 获取公司的关键联系人
 */
export async function getKeyContactsFromApollo(
  domain: string,
  roles: string[] = ['CEO', 'CTO', 'CFO', 'VP', 'Director', 'Manager']
): Promise<Array<{
  name: string
  email: string
  title: string
  linkedin?: string
  phone?: string
}>> {
  const { getApiKey } = await import('@/lib/api-keys')
  const { apiKey } = await getApiKey('apollo', 'default')

  if (!apiKey) {
    return []
  }

  try {
    // 先获取公司信息
    const company = await searchCompanyFromApollo(domain)
    if (!company?.id) {
      return []
    }

    // 搜索联系人
    const contacts = await searchContactsFromApollo(company.id, {
      titles: roles,
      limit: 10,
    })

    return contacts.map(c => ({
      name: c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim(),
      email: c.email || '',
      title: c.title || '',
      linkedin: c.linkedin_url,
      phone: c.phone_numbers?.[0]?.number,
    })).filter(c => c.email)
  } catch (error) {
    console.error('Apollo contacts error:', error)
    return []
  }
}

/**
 * 获取员工规模标签
 */
function getCompanySizeLabel(count: number): string {
  if (count < 10) return '1-10'
  if (count < 50) return '11-50'
  if (count < 200) return '51-200'
  if (count < 500) return '201-500'
  if (count < 1000) return '501-1000'
  if (count < 5000) return '1001-5000'
  return '5000+'
}

/**
 * 格式化收入
 */
function formatRevenue(revenue: number): string {
  if (revenue >= 1000000000) {
    return `$${(revenue / 1000000000).toFixed(1)}B`
  }
  if (revenue >= 1000000) {
    return `$${(revenue / 1000000).toFixed(1)}M`
  }
  if (revenue >= 1000) {
    return `$${(revenue / 1000).toFixed(1)}K`
  }
  return `$${revenue}`
}

/**
 * 记录 API 调用
 */
async function logApolloCall(
  operation: string,
  target: string,
  success: boolean
) {
  try {
    const { prisma } = await import('@/lib/db')
    await prisma.apiCallLog.create({
      data: {
        service: 'apollo',
        operation,
        cost: 0.1, // 约 $0.1/次
        success,
        metadata: { target, timestamp: new Date().toISOString() },
      },
    })
  } catch (error) {
    console.error('Failed to log Apollo call:', error)
  }
}