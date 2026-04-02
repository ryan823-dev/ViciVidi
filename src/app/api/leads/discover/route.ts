import { NextRequest, NextResponse } from 'next/server'
import { getUser, getWorkspace } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { searchWithSerpApi } from '@/lib/services/serpapi'
import { findSimilarCompanies } from '@/lib/services/exa'
import { enrichFromTavily } from '@/lib/services/tavily'

/**
 * POST /api/leads/discover
 *
 * Keyword-driven lead discovery engine.
 * Runs SerpAPI + Exa + Tavily in parallel to surface company domains,
 * deduplicates, enriches, and upserts into the Lead table.
 *
 * Body:
 *   keyword   string  e.g. "European CNC distributors"
 *   industry  string? optional filter hint
 *   country   string? optional filter hint
 *   limit     number? max leads to create (default 20, max 50)
 */
export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const workspace = await getWorkspace()
  if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

  const body = await req.json()
  const keyword: string = (body.keyword || '').trim()
  const industry: string = (body.industry || '').trim()
  const country: string = (body.country || '').trim()
  const limit: number = Math.min(parseInt(body.limit || '20', 10), 50)

  if (!keyword) {
    return NextResponse.json({ error: 'keyword is required' }, { status: 400 })
  }

  // Build search queries enriched with context hints
  const contextSuffix = [industry, country].filter(Boolean).join(', ')
  const serpQuery = contextSuffix
    ? `${keyword} ${contextSuffix} company website`
    : `${keyword} company website`

  // ===== 1. Three-way parallel search =====
  const [serpResults, exaUrls, tavilyResult] = await Promise.allSettled([
    searchWithSerpApi(serpQuery),
    // Use Exa findSimilar anchored to a seed query result
    findSimilarCompaniesFromKeyword(keyword, country),
    enrichFromTavily(`${keyword} ${contextSuffix}`),
  ])

  // ===== 2. Extract & deduplicate domains =====
  const rawDomains = new Set<string>()

  if (serpResults.status === 'fulfilled') {
    for (const r of serpResults.value) {
      const d = extractDomain(r.link)
      if (d) rawDomains.add(d)
    }
  }

  if (exaUrls.status === 'fulfilled') {
    for (const url of exaUrls.value) {
      const d = extractDomain(url)
      if (d) rawDomains.add(d)
    }
  }

  // Tavily doesn't return company lists directly; use it for context only
  const tavilyContext =
    tavilyResult.status === 'fulfilled' && tavilyResult.value
      ? tavilyResult.value.data.description
      : undefined

  // Filter out known noise domains (social media, directories, etc.)
  const NOISE_DOMAINS = new Set([
    'linkedin.com', 'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
    'youtube.com', 'wikipedia.org', 'bloomberg.com', 'crunchbase.com',
    'glassdoor.com', 'indeed.com', 'yelp.com', 'amazon.com', 'alibaba.com',
    'google.com', 'bing.com', 'reddit.com', 'quora.com',
  ])

  const candidates = Array.from(rawDomains)
    .filter((d) => !NOISE_DOMAINS.has(d) && !d.endsWith('.gov') && !d.endsWith('.edu'))
    .slice(0, limit)

  if (candidates.length === 0) {
    return NextResponse.json({
      discovered: 0,
      created: 0,
      skipped: 0,
      leads: [],
      message: 'No company domains found for this keyword.',
    })
  }

  // ===== 3. Check for existing leads in this workspace (avoid duplicates) =====
  const existing = await prisma.lead.findMany({
    where: {
      workspaceId: workspace.id,
      domain: { in: candidates },
    },
    select: { domain: true },
  })
  const existingDomains = new Set(existing.map((l) => l.domain).filter(Boolean) as string[])

  const newDomains = candidates.filter((d) => !existingDomains.has(d))

  // ===== 4. Create leads (batch insert, no enrichment here — enrichment is async) =====
  const created: any[] = []
  const taskId = `discover_${Date.now()}`

  for (const domain of newDomains) {
    try {
      const lead = await prisma.lead.create({
        data: {
          workspaceId: workspace.id,
          companyName: domainToName(domain),
          domain,
          website: `https://${domain}`,
          industry: industry || undefined,
          country: country || undefined,
          status: 'NEW',
          priority: 'medium',
          sourceId: 'keyword_discover',
          sourceUrl: `keyword:${keyword}`,
          taskId,
          description: tavilyContext
            ? `Discovered via keyword: "${keyword}". Context: ${tavilyContext.substring(0, 300)}`
            : `Discovered via keyword: "${keyword}"`,
          tags: [
            'auto-discovered',
            ...(keyword.split(' ').slice(0, 2)),
          ],
        },
      })
      created.push({
        id: lead.id,
        companyName: lead.companyName,
        domain: lead.domain,
        website: lead.website,
        status: lead.status,
        country: lead.country,
        industry: lead.industry,
        createdAt: lead.createdAt,
      })
    } catch {
      // Skip duplicates or constraint errors
    }
  }

  // ===== 5. Trigger background enrichment for newly created leads =====
  // Fire-and-forget: don't await, let it run asynchronously
  triggerEnrichmentBatch(created.map((l) => l.id)).catch(console.error)

  return NextResponse.json({
    discovered: candidates.length,
    created: created.length,
    skipped: existingDomains.size,
    taskId,
    leads: created,
    searchSummary: {
      serpApi: serpResults.status === 'fulfilled' ? serpResults.value.length : 0,
      exa: exaUrls.status === 'fulfilled' ? exaUrls.value.length : 0,
      tavilyContext: !!tavilyContext,
    },
  })
}

// ===== Helpers =====

function extractDomain(url: string): string | null {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

function domainToName(domain: string): string {
  // "acme-corp.com" -> "Acme Corp"
  const base = domain.split('.')[0]
  return base
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Use Exa findSimilar with a keyword-derived seed URL.
 * When no real domain is available, use a Brave/SerpAPI top result as the seed.
 */
async function findSimilarCompaniesFromKeyword(
  keyword: string,
  country: string
): Promise<string[]> {
  try {
    // Get top SerpAPI result to use as Exa seed
    const q = country ? `${keyword} ${country} manufacturer` : `${keyword} manufacturer`
    const results = await searchWithSerpApi(q)
    if (results.length === 0) return []

    const seedDomain = extractDomain(results[0].link)
    if (!seedDomain) return []

    return await findSimilarCompanies(seedDomain)
  } catch {
    return []
  }
}

/**
 * Async enrichment batch — updates SharedCompany and Lead records in background.
 * This is deliberately fire-and-forget; failures are silent (logged only).
 */
async function triggerEnrichmentBatch(leadIds: string[]) {
  const { enrichCompanyData } = await import('@/lib/services/enrichment')

  for (const leadId of leadIds) {
    try {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId },
        select: { domain: true },
      })
      if (!lead?.domain) continue

      // Find or create SharedCompany
      let company = await prisma.sharedCompany.findUnique({
        where: { domain: lead.domain },
      })
      if (!company) {
        company = await prisma.sharedCompany.create({
          data: { domain: lead.domain, sources: [] },
        })
      }

      await enrichCompanyData(company.id, {
        usePaidSources: true,
        priority: 'accuracy',
      })

      // Mark lead as enriched
      await prisma.lead.update({
        where: { id: leadId },
        data: { enrichedAt: new Date(), enriching: false },
      })
    } catch (err) {
      console.error(`Enrichment failed for lead ${leadId}:`, err)
    }
  }
}
