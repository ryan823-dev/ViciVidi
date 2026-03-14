/**
 * 数据丰富引擎 v3.1
 * 
 * 优先级架构（100% 免费/有免费额度，最小化成本）：
 * 
 * 第1层：官方/公共免费源（完全免费）
 *   ├── SEC/EDGAR（美国上市公司，无需API Key）
 *   ├── Companies House API（英国公司，免费）
 *   └── 企查查/天眼查（中国企业，按量付费可选）
 * 
 * 第2层：公共网页抓取（自建，免费）
 *   ├── 官网首页/产品页/定价页
 *   ├── About/Team/Leadership
 *   ├── Careers（招聘信号）
 *   └── Blog/News/Press
 * 
 * 第3层：有免费额度的 API
 *   ├── Apollo.io（公司+联系人，50次/月免费）
 *   ├── Skrapp.io（邮箱查找，100次/月免费）
 *   ├── Hunter.io（邮箱备用，25次/月免费）
 *   ├── Google Places（公司信息，$200/月免费额度）
 *   ├── Brave Search（搜索/邮箱，2000次/月免费）
 *   └── Firecrawl（复杂站点，500次/月免费）
 */

import { enrichFromCompaniesHouse } from './companies-house'
import { enrichFromSEC } from './sec-edgar'
import { enrichChineseCompany } from './chinese-companies'
import { enrichFromWebScraper } from './web-scraper'
import { enrichFromApollo } from './apollo'
import { enrichFromSkrapp } from './skrapp'
import { enrichFromBraveSearch } from './brave-search'
import { enrichFromGooglePlaces } from './google-places'
import { findEmailsFromHunter } from './hunter'
import { enrichFromFirecrawl } from './firecrawl'
import { prisma } from '@/lib/db'

interface EnrichmentOptions {
  usePaidSources?: boolean
  priority?: 'speed' | 'accuracy' | 'cost'
  skipOfficialSources?: boolean
  region?: 'CN' | 'UK' | 'US' | 'GLOBAL' | 'AUTO'
  maxCostPerCompany?: number
}

interface EnrichmentResult {
  success: boolean
  company: any
  sourcesAdded: number
  cost: number
  layers: {
    official: boolean
    webScrape: boolean
    paid: boolean
  }
  sourcesUsed: string[]
  message?: string
}

export async function enrichCompanyData(
  companyId: string,
  options: EnrichmentOptions = {}
): Promise<EnrichmentResult> {
  const {
    usePaidSources = false,
    priority = 'cost',
    skipOfficialSources = false,
    region = 'AUTO',
    maxCostPerCompany = 0.10,
  } = options

  try {
    const company = await prisma.sharedCompany.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      return {
        success: false,
        company: null,
        sourcesAdded: 0,
        cost: 0,
        layers: { official: false, webScrape: false, paid: false },
        sourcesUsed: [],
        message: 'Company not found',
      }
    }

    const domain = company.domain
    let totalCost = 0
    let sourcesAdded = 0
    const updates: Record<string, unknown> = {}
    const newSources: any[] = []
    const layers = { official: false, webScrape: false, paid: false }
    const sourcesUsed: string[] = []

    // ============ 第1层：官方/公共免费源 ============
    if (!skipOfficialSources) {
      // 中国企业
      if (region === 'CN' || (region === 'AUTO' && isChineseDomain(domain))) {
        const cnResult = await enrichChineseCompany(company.name || domain)
        if (cnResult) {
          mergeResults(updates, cnResult.data)
          newSources.push(...cnResult.sources)
          sourcesAdded += cnResult.sources.length
          layers.official = true
          sourcesUsed.push('Chinese Registry')
        }
      }

      // 英国公司
      if (!layers.official && (region === 'UK' || region === 'AUTO')) {
        const ukResult = await enrichFromCompaniesHouse(domain, company.name || undefined)
        if (ukResult) {
          mergeResults(updates, ukResult.data)
          newSources.push(...ukResult.sources)
          sourcesAdded += ukResult.sources.length
          layers.official = true
          sourcesUsed.push('Companies House')
        }
      }

      // 美国上市公司
      if (!layers.official && (region === 'US' || region === 'AUTO')) {
        const secResult = await enrichFromSEC(domain)
        if (secResult) {
          mergeResults(updates, secResult.data)
          newSources.push(...secResult.sources)
          sourcesAdded += secResult.sources.length
          layers.official = true
          sourcesUsed.push('SEC EDGAR')
        }
      }
    }

    // ============ 第2层：公共网页抓取 ============
    const webResult = await enrichFromWebScraper(domain)
    if (webResult) {
      mergeResults(updates, webResult.data)
      newSources.push(...webResult.sources)
      sourcesAdded += webResult.sources.length
      layers.webScrape = true
      sourcesUsed.push('Web Scraper')
    }

    // ============ 第3层：高性价比付费 API ============
    if (usePaidSources && totalCost < maxCostPerCompany) {
      // 1. Apollo.io（公司+联系人一体化，数据最全）
      if (priority === 'accuracy' || !updates.email) {
        const apolloResult = await enrichFromApollo(domain)
        if (apolloResult) {
          mergeResults(updates, apolloResult.data)
          newSources.push(...apolloResult.sources)
          sourcesAdded += apolloResult.sources.length
          totalCost += 0.10
          layers.paid = true
          sourcesUsed.push('Apollo.io')
        }
      }

      // 2. Skrapp.io（邮箱查找，性价比最高，主用）
      if (!updates.email && totalCost < maxCostPerCompany) {
        const skrappResult = await enrichFromSkrapp(domain)
        if (skrappResult) {
          mergeResults(updates, skrappResult.data)
          newSources.push(...skrappResult.sources)
          sourcesAdded += skrappResult.sources.length
          totalCost += 0.05
          layers.paid = true
          sourcesUsed.push('Skrapp.io')
        }
      }

      // 3. Hunter.io（邮箱查找备用，仅当 Skrapp 找不到时使用）
      if (!updates.email && totalCost < maxCostPerCompany) {
        const hunterResult = await findEmailsFromHunter(domain)
        if (hunterResult) {
          const emails = hunterResult.data.emails as any[]
          if (emails && emails.length > 0) {
            updates.email = emails[0].email
          }
          newSources.push(...hunterResult.sources)
          sourcesAdded += hunterResult.sources.length
          totalCost += 0.02
          layers.paid = true
          sourcesUsed.push('Hunter.io')
        }
      }

      // 4. Google Places（获取电话、地址）
      if (!updates.phone && totalCost < maxCostPerCompany) {
        const placesResult = await enrichFromGooglePlaces(domain)
        if (placesResult) {
          mergeResults(updates, placesResult.data)
          newSources.push(...placesResult.sources)
          sourcesAdded += placesResult.sources.length
          totalCost += 0.017
          layers.paid = true
          sourcesUsed.push('Google Places')
        }
      }

      // 5. Brave Search（搜索补充）
      if (!updates.email && totalCost < maxCostPerCompany) {
        const searchResult = await enrichFromBraveSearch(domain)
        if (searchResult) {
          if (searchResult.data.emails && !updates.email) {
            const emails = searchResult.data.emails as string[]
            updates.email = emails[0]
          }
          newSources.push(...searchResult.sources)
          sourcesAdded += searchResult.sources.length
          totalCost += 0.005
          layers.paid = true
          sourcesUsed.push('Brave Search')
        }
      }

      // 6. Firecrawl 兜底（复杂站点）
      if (!layers.webScrape && !updates.email && !updates.phone && totalCost < maxCostPerCompany) {
        const firecrawlResult = await enrichFromFirecrawl(domain)
        if (firecrawlResult) {
          mergeResults(updates, firecrawlResult.data)
          newSources.push(...firecrawlResult.sources)
          sourcesAdded += firecrawlResult.sources.length
          totalCost += 0.01
          layers.paid = true
          sourcesUsed.push('Firecrawl')
        }
      }
    }

    if (sourcesAdded === 0) {
      return {
        success: false,
        company,
        sourcesAdded: 0,
        cost: totalCost,
        layers,
        sourcesUsed,
        message: 'No enrichment data found',
      }
    }

    const updatedCompany = await prisma.sharedCompany.update({
      where: { id: companyId },
      data: {
        ...updates,
        sources: { push: newSources },
        lastVerifiedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return {
      success: true,
      company: updatedCompany,
      sourcesAdded,
      cost: totalCost,
      layers,
      sourcesUsed,
      message: `Enriched with ${sourcesAdded} sources (Cost: $${totalCost.toFixed(3)})`,
    }
  } catch (error) {
    console.error('Enrichment error:', error)
    return {
      success: false,
      company: null,
      sourcesAdded: 0,
      cost: 0,
      layers: { official: false, webScrape: false, paid: false },
      sourcesUsed: [],
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

function mergeResults(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(source)) {
    if (target[key] === undefined && value !== undefined && value !== null) {
      target[key] = value
    }
  }
}

function isChineseDomain(domain: string): boolean {
  const chineseTLDs = ['.cn', '.com.cn', '.net.cn', '.org.cn', '.gov.cn', '.edu.cn']
  return chineseTLDs.some(tld => domain.endsWith(tld))
}

export async function enrichCompaniesBatch(
  companyIds: string[],
  options: EnrichmentOptions = {}
): Promise<{
  success: number
  failed: number
  totalCost: number
  layerStats: { official: number; webScrape: number; paid: number }
  sourceStats: Record<string, number>
}> {
  let successCount = 0
  let failedCount = 0
  let totalCost = 0
  const layerStats = { official: 0, webScrape: 0, paid: 0 }
  const sourceStats: Record<string, number> = {}

  for (const companyId of companyIds) {
    const result = await enrichCompanyData(companyId, options)
    if (result.success) {
      successCount++
      totalCost += result.cost
      if (result.layers.official) layerStats.official++
      if (result.layers.webScrape) layerStats.webScrape++
      if (result.layers.paid) layerStats.paid++
      for (const source of result.sourcesUsed) {
        sourceStats[source] = (sourceStats[source] || 0) + 1
      }
    } else {
      failedCount++
    }
    await new Promise((resolve) => setTimeout(resolve, 300))
  }

  return { success: successCount, failed: failedCount, totalCost, layerStats, sourceStats }
}

export async function checkDataFreshness(companyId: string): Promise<{
  isFresh: boolean
  lastVerified: Date | null
  daysSinceVerification: number | null
}> {
  const company = await prisma.sharedCompany.findUnique({
    where: { id: companyId },
    select: { lastVerifiedAt: true },
  })
  if (!company?.lastVerifiedAt) {
    return { isFresh: false, lastVerified: null, daysSinceVerification: null }
  }
  const daysSinceVerification = Math.floor(
    (Date.now() - company.lastVerifiedAt.getTime()) / (1000 * 60 * 60 * 24)
  )
  return { isFresh: daysSinceVerification < 30, lastVerified: company.lastVerifiedAt, daysSinceVerification }
}

export function enrichWithFreeSourcesOnly(companyId: string): Promise<EnrichmentResult> {
  return enrichCompanyData(companyId, { usePaidSources: false, priority: 'cost' })
}

export function enrichWithAllSources(companyId: string): Promise<EnrichmentResult> {
  return enrichCompanyData(companyId, { usePaidSources: true, priority: 'accuracy' })
}

export function enrichWithCostOptimization(companyId: string, maxCost: number = 0.05): Promise<EnrichmentResult> {
  return enrichCompanyData(companyId, { usePaidSources: true, priority: 'cost', maxCostPerCompany: maxCost })
}