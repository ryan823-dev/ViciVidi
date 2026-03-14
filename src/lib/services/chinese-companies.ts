/**
 * 中国企业数据服务
 * 整合企查查和天眼查 API
 * 
 * 企查查开放平台：https://openapi.qcc.com/
 * 天眼查开放平台：https://open.tianyancha.com/
 * 
 * 注意：这两个平台都需要付费订阅，但数据质量和覆盖度都很高
 * 
 * 数据类型：
 * - 企业工商信息
 * - 股东信息
 * - 高管信息
 * - 司法风险
 * - 知识产权
 * - 经营状况
 */

interface ChineseCompany {
  // 基本信息
  name: string                    // 企业名称
  creditCode: string             // 统一社会信用代码
  regNumber?: string             // 注册号
  orgCode?: string               // 组织机构代码
  
  // 注册信息
  regStatus?: string             // 经营状态（存续、注销、吊销等）
  regCapital?: string            // 注册资本
  paidCapital?: string           // 实缴资本
  regDate?: string               // 成立日期
  businessStart?: string         // 营业期限开始
  businessEnd?: string           // 营业期限结束
  regAuthority?: string          // 登记机关
  approveDate?: string           // 核准日期
  
  // 类型信息
  companyType?: string           // 企业类型（有限责任公司、股份有限公司等）
  industry?: string              // 行业
  businessScope?: string         // 经营范围
  
  // 地址信息
  regAddress?: string            // 注册地址
  businessAddress?: string       // 经营地址
  
  // 联系方式
  phone?: string                 // 电话
  email?: string                 // 邮箱
  website?: string               // 网站
  
  // 人员信息
  legalPerson?: string           // 法定代表人
  employees?: number             // 员工人数
  
  // 股东信息
  shareholders?: Array<{
    name: string
    type: string                 // 自然人/企业
    ratio?: string               // 持股比例
    capital?: string             // 认缴出资
  }>
  
  // 高管信息
  executives?: Array<{
    name: string
    position: string
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

// ============ 企查查 API ============

const QCC_API = 'https://api.qichacha.com'

/**
 * 企查查搜索企业
 */
export async function searchCompanyFromQCC(
  keyword: string
): Promise<ChineseCompany[] | null> {
  const apiKey = process.env.QCC_API_KEY
  const secretKey = process.env.QCC_SECRET_KEY

  if (!apiKey || !secretKey) {
    console.warn('QCC API keys not configured')
    return null
  }

  try {
    // 企查查需要特定的签名方式
    const timestamp = Date.now().toString()
    const signature = await generateQCCSignature(apiKey, secretKey, timestamp)

    const response = await fetch(
      `${QCC_API}/ECISimple/GetSimpleInfoByKeyWord?keyword=${encodeURIComponent(keyword)}`,
      {
        headers: {
          'Authorization': apiKey,
          'X-Token': signature,
          'X-Timestamp': timestamp,
        },
      }
    )

    if (!response.ok) {
      console.error('QCC search error:', response.status)
      return null
    }

    const data = await response.json()
    
    if (data.Status !== '200') {
      return null
    }

    return parseQCCSearchResults(data.Result)
  } catch (error) {
    console.error('QCC search error:', error)
    return null
  }
}

/**
 * 企查查获取企业详情
 */
export async function getCompanyDetailFromQCC(
  creditCode: string
): Promise<ChineseCompany | null> {
  const apiKey = process.env.QCC_API_KEY
  const secretKey = process.env.QCC_SECRET_KEY

  if (!apiKey || !secretKey) {
    return null
  }

  try {
    const timestamp = Date.now().toString()
    const signature = await generateQCCSignature(apiKey, secretKey, timestamp)

    const response = await fetch(
      `${QCC_API}/ECIV2/GetDetailsByCreditCode?creditCode=${creditCode}`,
      {
        headers: {
          'Authorization': apiKey,
          'X-Token': signature,
          'X-Timestamp': timestamp,
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    if (data.Status !== '200') {
      return null
    }

    return parseQCCDetail(data.Result)
  } catch (error) {
    console.error('QCC detail error:', error)
    return null
  }
}

// ============ 天眼查 API ============

const TYC_API = 'https://open.api.tianyancha.com'

/**
 * 天眼查搜索企业
 */
export async function searchCompanyFromTYC(
  keyword: string
): Promise<ChineseCompany[] | null> {
  const apiKey = process.env.TYC_API_KEY

  if (!apiKey) {
    console.warn('TYC API key not configured')
    return null
  }

  try {
    const response = await fetch(
      `${TYC_API}/services/v3/open/search?keyword=${encodeURIComponent(keyword)}`,
      {
        headers: {
          'Authorization': apiKey,
        },
      }
    )

    if (!response.ok) {
      console.error('TYC search error:', response.status)
      return null
    }

    const data = await response.json()
    
    if (data.error_code !== '0') {
      return null
    }

    return parseTYCSearchResults(data.result?.items || [])
  } catch (error) {
    console.error('TYC search error:', error)
    return null
  }
}

/**
 * 天眼查获取企业详情
 */
export async function getCompanyDetailFromTYC(
  id: string
): Promise<ChineseCompany | null> {
  const apiKey = process.env.TYC_API_KEY

  if (!apiKey) {
    return null
  }

  try {
    const response = await fetch(
      `${TYC_API}/services/v4/open/company/baseinfo?id=${id}`,
      {
        headers: {
          'Authorization': apiKey,
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    if (data.error_code !== '0') {
      return null
    }

    return parseTYCDetail(data.result)
  } catch (error) {
    console.error('TYC detail error:', error)
    return null
  }
}

// ============ 统一接口 ============

/**
 * 从域名或公司名查找中国企业
 */
export async function enrichChineseCompany(
  query: string
): Promise<EnrichmentResult | null> {
  // 优先使用企查查，备用天眼查
  let company: ChineseCompany | null = null
  let source = ''

  // 尝试企查查
  company = await getCompanyDetailFromQCC(query)
  if (company) {
    source = 'qcc'
  }

  // 如果企查查没有，尝试天眼查
  if (!company) {
    const tycResults = await searchCompanyFromTYC(query)
    if (tycResults && tycResults.length > 0) {
      company = tycResults[0]
      source = 'tyc'
    }
  }

  if (!company) {
    return null
  }

  const result: EnrichmentResult = {
    data: {},
    sources: []
  }

  const sourceUrl = source === 'qcc' 
    ? `https://www.qcc.com/firm/${company.creditCode}.html`
    : `https://www.tianyancha.com/company/${company.creditCode}`

  // 基本信息
  if (company.name) {
    result.data.name = company.name
    result.sources.push({
      field: 'name',
      source_url: sourceUrl,
      snippet: company.name,
      confidence: 0.95,
      verified_at: new Date().toISOString(),
    })
  }

  // 统一社会信用代码
  if (company.creditCode) {
    result.data.creditCode = company.creditCode
    result.data.companyNumber = company.creditCode
  }

  // 法定代表人
  if (company.legalPerson) {
    result.data.legalPerson = company.legalPerson
    result.data.ceo = company.legalPerson
    result.sources.push({
      field: 'legalPerson',
      source_url: sourceUrl,
      snippet: company.legalPerson,
      confidence: 0.95,
      verified_at: new Date().toISOString(),
    })
  }

  // 注册资本
  if (company.regCapital) {
    result.data.registeredCapital = company.regCapital
    result.data.regCapital = company.regCapital
  }

  // 成立日期
  if (company.regDate) {
    result.data.foundedDate = company.regDate
    result.data.incorporationDate = company.regDate
  }

  // 经营状态
  if (company.regStatus) {
    result.data.companyStatus = company.regStatus
    result.data.operatingStatus = company.regStatus
  }

  // 企业类型
  if (company.companyType) {
    result.data.companyType = company.companyType
  }

  // 行业
  if (company.industry) {
    result.data.industry = company.industry
  }

  // 经营范围
  if (company.businessScope) {
    result.data.businessScope = company.businessScope
  }

  // 地址
  if (company.regAddress) {
    result.data.address = company.regAddress
    result.data.registeredAddress = company.regAddress
    result.data.country = 'China'
  }

  // 联系方式
  if (company.phone) {
    result.data.phone = company.phone
  }
  if (company.email) {
    result.data.email = company.email
  }

  // 股东
  if (company.shareholders && company.shareholders.length > 0) {
    result.data.shareholders = company.shareholders
  }

  // 高管
  if (company.executives && company.executives.length > 0) {
    result.data.executives = company.executives
    result.data.keyPeople = company.executives.slice(0, 5).map(e => e.name)
  }

  // 员工数
  if (company.employees) {
    result.data.employeeCount = company.employees
  }

  result.data.dataSource = source === 'qcc' ? '企查查' : '天眼查'
  result.data.companyRegistry = 'China SAMR'

  return result
}

// ============ 辅助函数 ============

/**
 * 生成企查查签名
 */
async function generateQCCSignature(
  apiKey: string,
  secretKey: string,
  timestamp: string
): Promise<string> {
  const crypto = await import('crypto')
  const str = `${apiKey}${timestamp}${secretKey}`
  return crypto.createHash('md5').update(str).digest('hex').toUpperCase()
}

/**
 * 解析企查查搜索结果
 */
function parseQCCSearchResults(results: any[]): ChineseCompany[] {
  return results.map(item => ({
    name: item.Name,
    creditCode: item.CreditCode,
    regStatus: item.Status,
    regCapital: item.RegistCapi,
    regDate: item.StartDate,
    legalPerson: item.OperName,
    regAddress: item.Address,
    businessScope: item.Scope,
  }))
}

/**
 * 解析企查查详情
 */
function parseQCCDetail(detail: any): ChineseCompany {
  return {
    name: detail.Name,
    creditCode: detail.CreditCode,
    regNumber: detail.No,
    regStatus: detail.Status,
    regCapital: detail.RegistCapi,
    regDate: detail.StartDate,
    businessStart: detail.CheckDate,
    regAuthority: detail.BelongOrg,
    companyType: detail.EconKind,
    industry: detail.RecRoristDate,
    businessScope: detail.Scope,
    regAddress: detail.Address,
    phone: detail.Phone,
    email: detail.Email,
    legalPerson: detail.OperName,
    shareholders: detail.Partners?.map((p: any) => ({
      name: p.StockName,
      type: p.StockType,
      ratio: p.StockPercent,
    })),
  }
}

/**
 * 解析天眼查搜索结果
 */
function parseTYCSearchResults(items: any[]): ChineseCompany[] {
  return items.map(item => ({
    name: item.name,
    creditCode: item.creditCode,
    regStatus: item.regStatus,
    regCapital: item.regCapital,
    regDate: item.estiblishTime,
    legalPerson: item.legalPersonName,
    regAddress: item.regLocation,
  }))
}

/**
 * 解析天眼查详情
 */
function parseTYCDetail(detail: any): ChineseCompany {
  return {
    name: detail.name,
    creditCode: detail.creditCode,
    regNumber: detail.regNumber,
    regStatus: detail.regStatus,
    regCapital: detail.regCapital,
    regDate: detail.estiblishTime,
    regAuthority: detail.regInstitute,
    companyType: detail.companyOrgType,
    industry: detail.industry,
    businessScope: detail.businessScope,
    regAddress: detail.regLocation,
    phone: detail.phoneNumber,
    email: detail.email,
    legalPerson: detail.legalPersonName,
    employees: detail.staffNumRange,
  }
}