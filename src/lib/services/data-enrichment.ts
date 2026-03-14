/**
 * 数据丰富化服务 - 瀑布式补齐
 * 
 * 依次尝试多个数据源，最大化数据补齐成功率：
 * 1. Apollo (已集成)
 * 2. Clearbit (公司/联系人补齐)
 * 3. Hunter (邮箱查找)
 * 4. Clay (瀑布式丰富化 - 75+ 数据源)
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { getApiKey } from '@/lib/api-keys'

const execAsync = promisify(exec)

const TOOLS_DIR = process.cwd() + '/src/lib/tools'

export interface EnrichmentResult {
  companyName?: string
  domain?: string
  website?: string
  industry?: string
  companySize?: string
  description?: string
  country?: string
  city?: string
  address?: string
  phone?: string
  email?: string
  contactName?: string
  contactTitle?: string
  linkedinUrl?: string
  source?: string
  matchScore?: number
}

export interface EnrichmentStats {
  source: string
  success: boolean
  duration: number
  data: any
}

/**
 * 运行 CLI 工具
 */
async function runCLI(
  tool: string,
  args: string[],
  envVars: Record<string, string>
): Promise<any> {
  const cmd = `node ${TOOLS_DIR}/${tool}.js ${args.join(' ')}`
  
  const env = {
    ...process.env,
    ...envVars,
  }

  try {
    const { stdout, stderr } = await execAsync(cmd, { env })
    
    if (stderr) {
      console.error(`[${tool}] stderr:`, stderr)
    }
    
    const result = JSON.parse(stdout)
    
    if (result.error) {
      return null
    }
    
    return result
  } catch (error) {
    console.error(`[${tool}] Error:`, error instanceof Error ? error.message : error)
    return null
  }
}

/**
 * 使用 Clearbit 补齐公司数据
 */
async function enrichFromClearbit(
  domain: string
): Promise<EnrichmentResult | null> {
  const { apiKey } = await getApiKey('clearbit', 'default')
  
  if (!apiKey) {
    console.warn('[Clearbit] API key not configured')
    return null
  }

  const result = await runCLI('clearbit', ['company', 'find', `--domain=${domain}`], {
    CLEARBIT_API_KEY: apiKey,
  })

  if (!result || !result.id) {
    return null
  }

  return {
    companyName: result.name,
    domain: result.domain,
    website: result.website,
    industry: result.category?.industry,
    companySize: String(result.metrics?.employees),
    description: result.bio,
    country: result.address?.country,
    city: result.address?.city,
    address: result.address?.streetAddress,
    phone: result.phone,
    linkedinUrl: result.linkedin?.handle,
    source: 'Clearbit',
  }
}

/**
 * 使用 Clearbit Prospector 搜索联系人
 */
async function findContactsFromClearbit(
  domain: string,
  options?: {
    title?: string
    seniority?: string
    role?: string
  }
): Promise<EnrichmentResult | null> {
  const { apiKey } = await getApiKey('clearbit', 'default')
  
  if (!apiKey) {
    return null
  }

  const args = ['prospector', 'search', `--domain=${domain}`]
  
  if (options?.title) {
    args.push(`--title=${options.title}`)
  }
  
  if (options?.seniority) {
    args.push(`--seniority=${options.seniority}`)
  }
  
  if (options?.role) {
    args.push(`--role=${options.role}`)
  }

  const result = await runCLI('clearbit', args, {
    CLEARBIT_API_KEY: apiKey,
  })

  if (!result || !result.people || result.people.length === 0) {
    return null
  }

  const person = result.people[0]
  
  return {
    contactName: person?.name?.fullName,
    contactTitle: person?.title,
    email: person?.email,
    phone: person?.phone,
    linkedinUrl: person?.linkedin?.handle,
    source: 'Clearbit Prospector',
  }
}

/**
 * 使用 Hunter 查找邮箱
 */
async function findEmailFromHunter(
  domain: string,
  firstName: string,
  lastName: string
): Promise<EnrichmentResult | null> {
  const { apiKey } = await getApiKey('hunter', 'default')
  
  if (!apiKey) {
    return null
  }

  const result = await runCLI('hunter', [
    'email',
    'find',
    `--domain=${domain}`,
    `--first-name=${firstName}`,
    `--last-name=${lastName}`,
  ], {
    HUNTER_API_KEY: apiKey,
  })

  if (!result || !result.data || !result.data.email) {
    return null
  }

  return {
    email: result.data.email,
    contactName: `${result.data.first_name} ${result.data.last_name}`,
    contactTitle: result.data.position,
    source: 'Hunter',
  }
}

/**
 * 使用 Hunter 搜索公司所有邮箱
 */
async function searchEmailsFromHunter(
  domain: string,
  limit?: number
): Promise<EnrichmentResult[] | null> {
  const { apiKey } = await getApiKey('hunter', 'default')
  
  if (!apiKey) {
    return null
  }

  const args = ['domain', 'search', `--domain=${domain}`]
  
  if (limit) {
    args.push(`--limit=${limit}`)
  }

  const result = await runCLI('hunter', args, {
    HUNTER_API_KEY: apiKey,
  })

  if (!result || !result.data || !result.data.emails) {
    return null
  }

  return result.data.emails.map((email: any) => ({
    email: email.value,
    contactName: `${email.first_name} ${email.last_name}`,
    contactTitle: email.position,
    source: 'Hunter',
  }))
}

/**
 * 使用 Clay 丰富化公司数据
 */
async function enrichFromClay(
  domain: string
): Promise<EnrichmentResult | null> {
  const { apiKey } = await getApiKey('clay', 'default')
  
  if (!apiKey) {
    return null
  }

  const result = await runCLI('clay', [
    'companies',
    'enrich',
    `--domain=${domain}`,
  ], {
    CLAY_API_KEY: apiKey,
  })

  if (!result || !result.id) {
    return null
  }

  return {
    companyName: result.name,
    domain: result.domain,
    website: result.website,
    industry: result.industry,
    companySize: result.employeeCount ? String(result.employeeCount) : undefined,
    description: result.description,
    country: result.country,
    city: result.city,
    phone: result.phone,
    linkedinUrl: result.linkedinUrl,
    source: 'Clay',
  }
}

/**
 * 使用 Clay 丰富化联系人数据
 */
async function enrichPersonFromClay(
  options: {
    email?: string
    linkedinUrl?: string
    firstName?: string
    lastName?: string
    domain?: string
  }
): Promise<EnrichmentResult | null> {
  const { apiKey } = await getApiKey('clay', 'default')
  
  if (!apiKey) {
    return null
  }

  const args = ['people', 'enrich']
  
  if (options.email) {
    args.push(`--email=${options.email}`)
  } else if (options.linkedinUrl) {
    args.push(`--linkedin=${options.linkedinUrl}`)
  } else if (options.firstName && options.lastName && options.domain) {
    args.push(`--first-name=${options.firstName}`)
    args.push(`--last-name=${options.lastName}`)
    args.push(`--domain=${options.domain}`)
  } else {
    return null
  }

  const result = await runCLI('clay', args, {
    CLAY_API_KEY: apiKey,
  })

  if (!result || !result.id) {
    return null
  }

  return {
    contactName: `${result.firstName || ''} ${result.lastName || ''}`.trim(),
    contactTitle: result.title,
    email: result.email,
    phone: result.phone,
    linkedinUrl: result.linkedinUrl,
    source: 'Clay',
  }
}

/**
 * 瀑布式丰富化 - 依次尝试多个数据源
 * 
 * 流程：
 * 1. Apollo (已有)
 * 2. Clearbit
 * 3. Clay
 */
export async function waterfallEnrichCompany(
  domain: string
): Promise<{
  result: EnrichmentResult | null
  stats: EnrichmentStats[]
}> {
  const stats: EnrichmentStats[] = []
  
  // 1. 先尝试 Apollo
  const startTime = Date.now()
  const { enrichFromApollo } = await import('./apollo')
  const apolloResult: any = await enrichFromApollo(domain)
  stats.push({
    source: 'Apollo',
    success: !!apolloResult,
    duration: Date.now() - startTime,
    data: apolloResult,
  })
  
  if (apolloResult?.data) {
    // 转换 Apollo 结果到我们的格式
    const result: EnrichmentResult = {
      companyName: apolloResult.data.name,
      domain: apolloResult.data.primaryDomain,
      website: apolloResult.data.website,
      industry: apolloResult.data.industry,
      companySize: apolloResult.data.companySize,
      description: apolloResult.data.description,
      country: apolloResult.data.country,
      city: apolloResult.data.city,
      phone: apolloResult.data.phone,
      email: apolloResult.data.email,
      linkedinUrl: apolloResult.data.linkedinUrl,
      source: 'Apollo',
    }
    return { result, stats }
  }

  // 2. 尝试 Clearbit
  const clearbitStart = Date.now()
  const clearbitResult = await enrichFromClearbit(domain)
  stats.push({
    source: 'Clearbit',
    success: !!clearbitResult,
    duration: Date.now() - clearbitStart,
    data: clearbitResult,
  })
  
  if (clearbitResult) {
    return { result: clearbitResult, stats }
  }

  // 3. 尝试 Clay
  const clayStart = Date.now()
  const clayResult = await enrichFromClay(domain)
  stats.push({
    source: 'Clay',
    success: !!clayResult,
    duration: Date.now() - clayStart,
    data: clayResult,
  })
  
  return { result: clayResult, stats }
}

/**
 * 查找关键联系人 - 瀑布式
 * 
 * 流程：
 * 1. Clearbit Prospector
 * 2. Hunter Domain Search
 * 3. Clay People Enrichment
 */
export async function waterfallFindContacts(
  domain: string,
  roles: string[] = ['CEO', 'CTO', 'CFO', 'VP', 'Director']
): Promise<{
  contacts: EnrichmentResult[]
  stats: EnrichmentStats[]
}> {
  const contacts: EnrichmentResult[] = []
  const stats: EnrichmentStats[] = []
  
  // 1. Clearbit Prospector
  for (const role of roles) {
    const startTime = Date.now()
    const contact = await findContactsFromClearbit(domain, {
      title: role,
    })
    
    stats.push({
      source: `Clearbit (${role})`,
      success: !!contact,
      duration: Date.now() - startTime,
      data: contact,
    })
    
    if (contact) {
      contacts.push(contact)
    }
  }
  
  // 2. Hunter Domain Search (如果 Clearbit 没找到)
  if (contacts.length === 0) {
    const hunterStart = Date.now()
    const hunterEmails = await searchEmailsFromHunter(domain, 10)
    
    stats.push({
      source: 'Hunter',
      success: !!hunterEmails,
      duration: Date.now() - hunterStart,
      data: hunterEmails,
    })
    
    if (hunterEmails) {
      contacts.push(...hunterEmails)
    }
  }
  
  return { contacts, stats }
}

/**
 * 验证邮箱
 */
export async function verifyEmail(
  email: string
): Promise<{
  valid: boolean
  confidence?: number
  source: string
} | null> {
  // 尝试 Hunter 验证
  const { apiKey } = await getApiKey('hunter', 'default')
  
  if (apiKey) {
    const result = await runCLI('hunter', [
      'email',
      'verify',
      `--email=${email}`,
    ], {
      HUNTER_API_KEY: apiKey,
    })
    
    if (result && result.data) {
      return {
        valid: result.data.status === 'valid',
        confidence: result.data.score,
        source: 'Hunter',
      }
    }
  }
  
  return null
}
