'use client'

import { useState } from 'react'
import {
  Search, Zap, Globe, Building2, ExternalLink,
  CheckCircle2, Loader2, ScanSearch, ChevronRight,
  MapPin, AlertCircle, Sparkles, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CREDIT_COSTS } from '@/lib/credits/config'

// ───── Types ─────
interface DiscoveredLead {
  id: string
  companyName: string
  domain: string
  website: string
  status: string
  country: string | null
  industry: string | null
  createdAt: string
}

interface DiscoverResult {
  discovered: number
  created: number
  skipped: number
  taskId: string
  leads: DiscoveredLead[]
  searchSummary: {
    serpApi: number
    exa: number
    tavilyContext: boolean
  }
}

// ───── Options ─────
const INDUSTRIES = [
  '', 'Manufacturing', 'Electronics', 'Machinery & Equipment', 'Chemical',
  'Textile & Apparel', 'Medical Devices', 'Automotive', 'Food & Beverage',
  'Construction Materials', 'Furniture', 'Logistics', 'Energy', 'IT & Software',
]

const COUNTRIES = [
  '', 'United States', 'Germany', 'United Kingdom', 'France', 'Italy',
  'Netherlands', 'Spain', 'Australia', 'Canada', 'Japan', 'South Korea',
  'India', 'Brazil', 'Mexico', 'United Arab Emirates', 'Saudi Arabia',
  'Poland', 'Turkey', 'Vietnam', 'Thailand',
]

const KEYWORD_PRESETS = [
  { label: 'CNC · EU', value: 'CNC machine distributor', country: 'Germany', icon: '⚙️' },
  { label: 'Shopify · US', value: 'Shopify store owner retailer', country: 'United States', icon: '🛒' },
  { label: 'Medical · UK', value: 'medical device importer wholesaler', country: 'United Kingdom', icon: '🏥' },
  { label: 'Furniture · AU', value: 'furniture importer buyer', country: 'Australia', icon: '🪑' },
  { label: 'Chemical · EU', value: 'chemical raw material distributor', country: 'Germany', icon: '🧪' },
  { label: 'Electronics · JP', value: 'consumer electronics retailer', country: 'Japan', icon: '💡' },
]

// ───── Phases animation data ─────
const PHASES = [
  { text: 'Activating 3-engine search...', engines: ['SerpAPI', 'Exa', 'Tavily'] },
  { text: 'Scanning the web, extracting domains...', engines: ['SerpAPI', 'Exa', 'Tavily'] },
  { text: 'Deduplicating and saving leads...', engines: ['SerpAPI', 'Exa', 'Tavily'] },
]

export default function DiscoverPage() {
  const [keyword, setKeyword] = useState('')
  const [industry, setIndustry] = useState('')
  const [country, setCountry] = useState('')
  const [limit, setLimit] = useState(20)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DiscoverResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phaseIdx, setPhaseIdx] = useState(0)

  async function handleDiscover() {
    if (!keyword.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    setPhaseIdx(0)

    const phaseTimer = setInterval(() => {
      setPhaseIdx((p) => Math.min(p + 1, PHASES.length - 1))
    }, 3000)

    try {
      const res = await fetch('/api/leads/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, industry, country, limit }),
      })

      clearInterval(phaseTimer)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Discovery failed')
      }

      const data: DiscoverResult = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Unknown error')
    } finally {
      clearInterval(phaseTimer)
      setLoading(false)
    }
  }

  function applyPreset(preset: typeof KEYWORD_PRESETS[0]) {
    setKeyword(preset.value)
    setCountry(preset.country)
    setIndustry('')
    setResult(null)
    setError(null)
  }

  const creditCost = CREDIT_COSTS.DISCOVER_LEAD * limit

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Page header ── */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-[oklch(0.65_0.28_25)] shadow-sm">
            <ScanSearch className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Smart Discovery</h1>
          <Badge variant="outline" className="text-primary border-primary/30 text-xs gap-1 ml-1">
            <Sparkles className="h-3 w-3" />
            AI-Powered
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground pl-1">
          Enter a keyword — SerpAPI + Exa + Tavily scan the web in parallel, auto-saving qualified leads.
        </p>
      </div>

      {/* ── Search card ── */}
      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-primary via-[oklch(0.55_0.30_320)] to-[oklch(0.65_0.28_25)]" />

        <div className="p-6 space-y-5">
          {/* Main keyword input */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
              Search keyword
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10 h-12 text-base rounded-xl border-border/60 focus:border-primary"
                  placeholder="e.g. European CNC distributors, Shopify furniture retailers US"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleDiscover()}
                />
              </div>
              <Button
                size="lg"
                onClick={handleDiscover}
                disabled={loading || !keyword.trim()}
                className="h-12 px-6 gap-2 rounded-xl bg-gradient-to-r from-primary to-[oklch(0.65_0.28_25)] hover:opacity-90 shrink-0"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                {loading ? 'Scanning...' : 'Discover'}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Industry</label>
              <select
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>{i || 'Any industry'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Country</label>
              <select
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c || 'Any country'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Max results</label>
              <select
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
              >
                {[10, 20, 30, 50].map((n) => (
                  <option key={n} value={n}>{n} leads</option>
                ))}
              </select>
            </div>
          </div>

          {/* Credit cost preview */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Zap className="h-3 w-3 text-amber-500" />
              <span>This search will consume up to <strong className="text-foreground">{creditCost} credits</strong> ({CREDIT_COSTS.DISCOVER_LEAD} cr × {limit} leads)</span>
            </div>
            <a href="/billing" className="text-primary hover:underline font-medium">Top up</a>
          </div>

          {/* Preset chips */}
          <div>
            <div className="text-xs text-muted-foreground mb-2">Quick presets:</div>
            <div className="flex flex-wrap gap-2">
              {KEYWORD_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all',
                    keyword === p.value && country === p.country
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <span>{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Loading state ── */}
      {loading && (
        <div className="rounded-2xl border bg-card p-10 text-center space-y-5">
          <div className="relative mx-auto w-fit">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <Zap className="absolute inset-0 m-auto h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{PHASES[phaseIdx].text}</p>
            <p className="text-sm text-muted-foreground mt-1">
              3-engine parallel scan — usually takes 10–20 seconds
            </p>
          </div>
          <div className="flex justify-center gap-6">
            {['SerpAPI (Google)', 'Exa Neural', 'Tavily AI'].map((s) => (
              <div key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Discovery failed</p>
            <p className="text-xs mt-0.5 opacity-80">{error}</p>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {result && !loading && (
        <div className="space-y-4">

          {/* Summary bar */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-lg font-bold leading-tight text-emerald-700">{result.created}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">New leads</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Globe className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-lg font-bold leading-tight text-blue-700">{result.discovered}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Domains found</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-lg font-bold leading-tight text-muted-foreground">{result.skipped}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Already in DB</div>
              </div>
            </div>
            <div className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Background enrichment running (PDL / Hunter / BuiltWith)
            </div>
          </div>

          {/* Engine breakdown */}
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700">
              SerpAPI <strong>{result.searchSummary.serpApi}</strong> hits
            </div>
            <div className="px-2.5 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-700">
              Exa Neural <strong>{result.searchSummary.exa}</strong> hits
            </div>
            {result.searchSummary.tavilyContext && (
              <div className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
                Tavily AI context generated
              </div>
            )}
          </div>

          {/* No new results */}
          {result.leads.length === 0 && (
            <div className="rounded-2xl border border-dashed bg-muted/30 p-12 text-center">
              <ScanSearch className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-medium text-sm">No new leads discovered</p>
              <p className="text-xs text-muted-foreground mt-1">
                {result.skipped > 0
                  ? `Found ${result.discovered} companies — all already in your pipeline.`
                  : 'Try a more specific keyword or adjust industry / country filters.'}
              </p>
            </div>
          )}

          {/* Lead cards */}
          {result.leads.length > 0 && (
            <div className="space-y-2.5">
              {result.leads.map((lead, idx) => (
                <div
                  key={lead.id}
                  className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  {/* Rank */}
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>

                  {/* Favicon */}
                  <div className="w-9 h-9 rounded-lg border bg-muted/40 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${lead.domain}&sz=32`}
                      alt=""
                      className="w-6 h-6 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate leading-tight">{lead.companyName}</div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                      >
                        <Globe className="h-3 w-3" />
                        {lead.domain}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                      {lead.country && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {lead.country}
                        </span>
                      )}
                      {lead.industry && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {lead.industry}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 bg-emerald-50 gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Saved
                    </Badge>
                    <Badge variant="outline" className="text-[10px] text-blue-500 border-blue-200 bg-blue-50 gap-1">
                      <Zap className="h-2.5 w-2.5" />
                      Enriching
                    </Badge>
                  </div>

                  {/* View link */}
                  <a
                    href={`/leads/${lead.id}`}
                    className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* CTA to leads */}
          {result.created > 0 && (
            <div className="flex justify-center pt-2">
              <a
                href="/leads"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-semibold"
              >
                View all {result.created} new leads in pipeline
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── Empty state (first time) ── */}
      {!result && !loading && !error && (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <ScanSearch className="h-7 w-7 text-primary/60" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Ready to find overseas buyers</p>
            <p className="text-sm text-muted-foreground mt-1">
              Type a keyword like &quot;CNC machine distributor Germany&quot; and hit Discover.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-1 text-xs text-muted-foreground">
            {['SerpAPI', 'Exa Neural', 'Tavily AI'].map((e) => (
              <div key={e} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                {e}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
