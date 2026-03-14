/**
 * People Data Labs (PDL) 数据丰富化服务
 * 
 * 28 亿 + 联系人档案
 * 超高质量数据补齐
 */

const PDL_API = 'https://api.peopledatalabs.com/v5'

export interface PDLPerson {
  id?: string
  fullName?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  title?: string
  company?: string
  companyWebsite?: string
  companySize?: string
  industry?: string
  linkedinUrl?: string
  twitterUrl?: string
  facebookUrl?: string
  githubUrl?: string
  location?: {
    name?: string
    region?: string
    country?: string
    geo?: string
  }
  experience?: Array<{
    company: {
      name: string
      size?: string
      industry?: string
      website?: string
      location?: {
        name?: string
        country?: string
      }
    }
    title?: string
    start_date?: string
    end_date?: string
    is_primary?: boolean
  }>
  education?: Array<{
    school?: {
      name?: string
      type?: string
      domain?: string
    }
    degrees?: string[]
    majors?: string[]
    start_date?: string
    end_date?: string
  }>
}

export interface PDLCompany {
  id?: string
  name?: string
  website?: string
  domain?: string
  industry?: string
  size?: string
  founded?: number
  location?: {
    name?: string
    region?: string
    country?: string
    geo?: string
    streetAddress?: string
    postalCode?: string
  }
  description?: string
  linkedinUrl?: string
  twitterUrl?: string
  facebookUrl?: string
  employeeCount?: number
  annualRevenue?: number
  technologies?: string[]
}

/**
 * 通过邮箱丰富联系人数据
 */
export async function enrichPersonByEmail(
  email: string
): Promise<PDLPerson | null> {
  const apiKey = process.env.PDL_API_KEY

  if (!apiKey) {
    console.warn('PDL API key not configured')
    return null
  }

  try {
    const response = await fetch(`${PDL_API}/person/enrich`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      console.error('PDL person enrich error:', response.status)
      return null
    }

    const result = await response.json()

    if (result.status !== 200 || !result.data) {
      return null
    }

    return parsePersonData(result.data)
  } catch (error) {
    console.error('PDL person enrich error:', error)
    return null
  }
}

/**
 * 通过姓名 + 公司丰富联系人数据
 */
export async function enrichPersonByName(
  firstName: string,
  lastName: string,
  options?: {
    domain?: string
    title?: string
    city?: string
    region?: string
    country?: string
  }
): Promise<PDLPerson | null> {
  const apiKey = process.env.PDL_API_KEY

  if (!apiKey) {
    return null
  }

  const body: any = {
    first_name: firstName,
    last_name: lastName,
  }

  if (options?.domain) body.domain = options.domain
  if (options?.title) body.title = options.title
  if (options?.city) body.city = options.city
  if (options?.region) body.region = options.region
  if (options?.country) body.country = options.country

  try {
    const response = await fetch(`${PDL_API}/person/enrich`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return null
    }

    const result = await response.json()

    if (result.status !== 200 || !result.data) {
      return null
    }

    return parsePersonData(result.data)
  } catch (error) {
    console.error('PDL person by name error:', error)
    return null
  }
}

/**
 * 通过域名丰富公司数据
 */
export async function enrichCompanyByDomain(
  domain: string
): Promise<PDLCompany | null> {
  const apiKey = process.env.PDL_API_KEY

  if (!apiKey) {
    return null
  }

  try {
    const response = await fetch(`${PDL_API}/company/enrich`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({ domain }),
    })

    if (!response.ok) {
      console.error('PDL company enrich error:', response.status)
      return null
    }

    const result = await response.json()

    if (result.status !== 200 || !result.data) {
      return null
    }

    return parseCompanyData(result.data)
  } catch (error) {
    console.error('PDL company enrich error:', error)
    return null
  }
}

/**
 * 搜索联系人
 */
export async function searchPeople(
  options: {
    title?: string
    company?: string
    industry?: string
    city?: string
    region?: string
    country?: string
    limit?: number
  }
): Promise<PDLPerson[]> {
  const apiKey = process.env.PDL_API_KEY

  if (!apiKey) {
    return []
  }

  const query = buildPDLQuery(options)

  try {
    const response = await fetch(`${PDL_API}/person/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        query,
        limit: options.limit || 10,
        pretty: true,
      }),
    })

    if (!response.ok) {
      return []
    }

    const result = await response.json()

    if (result.status !== 200 || !result.data) {
      return []
    }

    return result.data.map((person: any) => parsePersonData(person))
  } catch (error) {
    console.error('PDL people search error:', error)
    return []
  }
}

/**
 * 搜索公司
 */
export async function searchCompanies(
  options: {
    industry?: string
    size?: string
    location?: string
    founded?: number
    technologies?: string[]
    limit?: number
  }
): Promise<PDLCompany[]> {
  const apiKey = process.env.PDL_API_KEY

  if (!apiKey) {
    return []
  }

  const query = buildCompanyQuery(options)

  try {
    const response = await fetch(`${PDL_API}/company/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        query,
        limit: options.limit || 10,
        pretty: true,
      }),
    })

    if (!response.ok) {
      return []
    }

    const result = await response.json()

    if (result.status !== 200 || !result.data) {
      return []
    }

    return result.data.map((company: any) => parseCompanyData(company))
  } catch (error) {
    console.error('PDL companies search error:', error)
    return []
  }
}

/**
 * 构建 PDL 人员搜索查询
 */
function buildPDLQuery(options: any): string {
  const conditions: string[] = []

  if (options.title) {
    conditions.push(`job_title:"${options.title}"`)
  }

  if (options.company) {
    conditions.push(`job_company_name:"${options.company}"`)
  }

  if (options.industry) {
    conditions.push(`job_company_industry:"${options.industry}"`)
  }

  if (options.city) {
    conditions.push(`location.city:"${options.city}"`)
  }

  if (options.region) {
    conditions.push(`location.region:"${options.region}"`)
  }

  if (options.country) {
    conditions.push(`location.country:"${options.country}"`)
  }

  return conditions.join(' AND ')
}

/**
 * 构建 PDL 公司搜索查询
 */
function buildCompanyQuery(options: any): string {
  const conditions: string[] = []

  if (options.industry) {
    conditions.push(`industry:"${options.industry}"`)
  }

  if (options.size) {
    conditions.push(`employee_count:${options.size}`)
  }

  if (options.location) {
    conditions.push(`location.country:"${options.location}"`)
  }

  if (options.founded) {
    conditions.push(`founded:${options.founded}`)
  }

  if (options.technologies?.length) {
    conditions.push(`technologies:(${options.technologies.join(' OR ')})`)
  }

  return conditions.join(' AND ')
}

/**
 * 解析 PDL 人员数据
 */
function parsePersonData(data: any): PDLPerson {
  return {
    id: data.id,
    fullName: data.full_name,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.emails?.[0],
    phone: data.phone_numbers?.[0],
    title: data.job_title,
    company: data.job_company_name,
    companyWebsite: data.job_company_website,
    companySize: data.job_company_size,
    industry: data.industry,
    linkedinUrl: data.linkedin_url,
    twitterUrl: data.twitter_url,
    facebookUrl: data.facebook_url,
    githubUrl: data.github_url,
    location: {
      name: data.location_name,
      region: data.location_region,
      country: data.location_country?.[0],
      geo: data.location_geo,
    },
    experience: data.experience?.map((exp: any) => ({
      company: {
        name: exp.company?.name,
        size: exp.company?.size,
        industry: exp.company?.industry,
        website: exp.company?.website,
        location: {
          name: exp.company?.location?.name,
          country: exp.company?.location?.country,
        },
      },
      title: exp.title?.name,
      start_date: exp.start_date,
      end_date: exp.end_date,
      is_primary: exp.is_primary,
    })),
    education: data.education?.map((edu: any) => ({
      school: {
        name: edu.school?.name,
        type: edu.school?.type,
        domain: edu.school?.domain,
      },
      degrees: edu.degrees,
      majors: edu.majors,
      start_date: edu.start_date,
      end_date: edu.end_date,
    })),
  }
}

/**
 * 解析 PDL 公司数据
 */
function parseCompanyData(data: any): PDLCompany {
  return {
    id: data.id,
    name: data.name,
    website: data.website,
    domain: data.domain,
    industry: data.industry,
    size: data.size,
    founded: data.founded,
    location: {
      name: data.location?.name,
      region: data.location?.region,
      country: data.location?.country,
      geo: data.location?.geo,
      streetAddress: data.location?.street_address,
      postalCode: data.location?.postal_code,
    },
    description: data.description,
    linkedinUrl: data.linkedin_url,
    twitterUrl: data.twitter_url,
    facebookUrl: data.facebook_url,
    employeeCount: data.employee_count,
    annualRevenue: data.annual_revenue,
    technologies: data.technologies,
  }
}

/**
 * 批量丰富化（瀑布式）
 */
export async function waterfallEnrichPerson(
  email?: string,
  options?: {
    firstName?: string
    lastName?: string
    domain?: string
  }
): Promise<{
  result: PDLPerson | null
  source: string
}> {
  // 1. 优先用邮箱
  if (email) {
    const result = await enrichPersonByEmail(email)
    if (result) {
      return { result, source: 'PDL Email' }
    }
  }

  // 2. 用姓名 + 公司
  if (options?.firstName && options?.lastName) {
    const result = await enrichPersonByName(
      options.firstName,
      options.lastName,
      { domain: options.domain }
    )
    if (result) {
      return { result, source: 'PDL Name' }
    }
  }

  return { result: null, source: 'None' }
}
