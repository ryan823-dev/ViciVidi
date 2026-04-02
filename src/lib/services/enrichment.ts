/**
 * 数据丰富引擎 v3.2
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
 *
 * 并发策略（v3.2 优化）：
 *   - 第1层（官方源）+ 第2层（网页抓取）完全并发
 *   - 第3层分为 A/B/C 三组，组内并发，组间按依赖顺序执行
 *   - 批量处理从串行改为分批并发（每批 BATCH_SIZE 个）
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

// ===== 并发批次大小（防止 rate limit） =====
const BATCH_SIZE = 5

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

    // ===== 第1层 + 第2层：全部并发（无相互依赖） =====
    const isChinese = isChineseDomain(domain)

    // 构建官方源任务（根据 region）
    const officialTaskDefs: Array<{ task: Promise<any>; label: string }> = []
    if (!skipOfficialSources) {
      if (region === 'CN' || (region === 'AUTO' && isChinese)) {
        officialTaskDefs.push({
          task: enrichChineseCompany(company.name || domain).catch(() => null),
          label: 'Chinese Registry',
        })
      }
      if (region === 'UK' || region === 'AUTO') {
        officialTaskDefs.push({
          task: enrichFromCompaniesHouse(domain, company.name || undefined).catch(() => null),
          label: 'Companies House',
        })
      }
      if (region === 'US' || region === 'AUTO') {
        officialTaskDefs.push({
          task: enrichFromSEC(domain).catch(() => null),
          label: 'SEC EDGAR',
        })
      }
    }

    // 网页抓取与官方源并发
    const webTask = enrichFromWebScraper(domain).catch(() => null)

    const [officialResults, webResult] = await Promise.all([
      Promise.allSettled(officialTaskDefs.map((d) => d.task)),
      webTask,
    ])

    // 合并官方源结果（所有成功的源都合并，不只取第一个）
    for (let i = 0; i < officialResults.length; i++) {
      const r = officialResults[i]
      if (r.status === 'fulfilled' && r.value) {
        mergeResults(updates, r.value.data)
        newSources.push(...r.value.sources)
        sourcesAdded += r.value.sources.length
        layers.official = true
        sourcesUsed.push(officialTaskDefs[i].label)
      }
    }

    // 合并网页抓取结果
    if (webResult) {
      mergeResults(updates, webResult.data)
      newSources.push(...webResult.sources)
      sourcesAdded += webResult.sources.length
      layers.webScrape = true
      sourcesUsed.push('Web Scraper')
    }

    // ===== 第3层：付费 API（分组并发，组间顺序执行） =====
    if (usePaidSources && totalCost < maxCostPerCompany) {
      // --- 组A：Apollo（全量数据源，串行，成本最高） ---
      if (priority === 'accuracy' || !updates.email) {
        const apolloResult = await enrichFromApollo(domain).catch(() => null)
        if (apolloResult) {
          mergeResults(updates, apolloResult.data)
          newSources.push(...apolloResult.sources)
          sourcesAdded += apolloResult.sources.length
          totalCost += 0.10
          layers.paid = true
          sourcesUsed.push('Apollo.io')
        }
      }

      // --- 组B：Skrapp + Hunter（邮箱）+ Google Places（电话）—— 三者独立，并发 ---
      if (totalCost < maxCostPerCompany) {
        const needEmail = !updates.email
        const needPhone = !updates.phone

        const [skrappR, hunterR, placesR] = await Promise.allSettled([
          needEmail ? enrichFromSkrapp(domain).catch(() => null) : Promise.resolve(null),
          needEmail ? findEmailsFromHunter(domain).catch(() => null) : Promise.resolve(null),
          needPhone ? enrichFromGooglePlaces(domain).catch(() => null) : Promise.resolve(null),
        ])

        if (skrappR.status === 'fulfilled' && skrappR.value && !updates.email) {
          mergeResults(updates, skrappR.value.data)
          newSources.push(...skrappR.value.sources)
          sourcesAdded += skrappR.value.sources.length
          totalCost += 0.05
          layers.paid = true
          sourcesUsed.push('Skrapp.io')
        }

        // Hunter 仅在 Skrapp 未找到 email 时使用
        if (hunterR.status === 'fulfilled' && hunterR.value && !updates.email) {
          const emails = (hunterR.value.data.emails as any[]) ?? []
          if (emails.length > 0) updates.email = emails[0].email
          newSources.push(...hunterR.value.sources)
          sourcesAdded += hunterR.value.sources.length
          totalCost += 0.02
          layers.paid = true
          sourcesUsed.push('Hunter.io')
        }

        if (placesR.status === 'fulfilled' && placesR.value) {
          mergeResults(updates, placesR.value.data)
          newSources.push(...placesR.value.sources)
          sourcesAdded += placesR.value.sources.length
          totalCost += 0.017
          layers.paid = true
          sourcesUsed.push('Google Places')
        }
      }

      // --- 组C：Brave Search + Firecrawl 兜底（仍缺数据时并发） ---
      if (!updates.email && !updates.phone && totalCost < maxCostPerCompany) {
        const [braveR, firecrawlR] = await Promise.allSettled([
          enrichFromBraveSearch(domain).catch(() => null),
          !layers.webScrape ? enrichFromFirecrawl(domain).catch(() => null) : Promise.resolve(null),
        ])

        if (braveR.status === 'fulfilled' && braveR.value) {
          const emails = (braveR.value.data.emails as string[]) ?? []
          if (emails.length > 0 && !updates.email) updates.email = emails[0]
          newSources.push(...braveR.value.sources)
          sourcesAdded += braveR.value.sources.length
          totalCost += 0.005
          layers.paid = true
          sourcesUsed.push('Brave Search')
        }

        if (firecrawlR.status === 'fulfilled' && firecrawlR.value) {
          mergeResults(updates, firecrawlR.value.data)
          newSources.push(...firecrawlR.value.sources)
          sourcesAdded += firecrawlR.value.sources.length
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
  return chineseTLDs.some((tld) => domain.endsWith(tld))
}

// ===== 批量丰富化（分批并发，每批 BATCH_SIZE 个） =====
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

  // 分批并发（每批 BATCH_SIZE 个，批次间 500ms 间隔防止 rate limit）
  for (let i = 0; i < companyIds.length; i += BATCH_SIZE) {
    const batch = companyIds.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map((id) => enrichCompanyData(id, options))
    )

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.success) {
        successCount++
        totalCost += r.value.cost
        if (r.value.layers.official) layerStats.official++
        if (r.value.layers.webScrape) layerStats.webScrape++
        if (r.value.layers.paid) layerStats.paid++
        for (const source of r.value.sourcesUsed) {
          sourceStats[source] = (sourceStats[source] || 0) + 1
        }
      } else {
        failedCount++
      }
    }

    // 批次间隔，防止触发 API rate limit
    if (i + BATCH_SIZE < companyIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
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
