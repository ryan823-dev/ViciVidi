'use client'

import { useState } from 'react'
import {
  Search, Zap, Globe, Building2, ExternalLink,
  CheckCircle2, Loader2, ScanSearch, ChevronRight,
  Tag, MapPin, Briefcase, AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ===== Types =====
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

// ===== Industry options =====
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

// ===== Preset keyword templates for foreign trade =====
const KEYWORD_PRESETS = [
  { label: 'CNC Distributors EU', value: 'CNC machine distributor', country: 'Germany' },
  { label: 'Shopify Retailers US', value: 'Shopify store owner retailer', country: 'United States' },
  { label: 'Medical Device Importers', value: 'medical device importer wholesaler', country: 'United Kingdom' },
  { label: 'Furniture Buyers AU', value: 'furniture importer buyer', country: 'Australia' },
  { label: 'Chemical Distributors EU', value: 'chemical raw material distributor', country: 'Germany' },
  { label: 'Electronics Retailers JP', value: 'consumer electronics retailer', country: 'Japan' },
]

export default function DiscoverPage() {
  const [keyword, setKeyword] = useState('')
  const [industry, setIndustry] = useState('')
  const [country, setCountry] = useState('')
  const [limit, setLimit] = useState(20)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DiscoverResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState<string>('')

  async function handleDiscover() {
    if (!keyword.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Simulate progress phases (UI only — API is synchronous)
      setPhase('正在召唤 SerpAPI + Exa + Tavily 三路搜索引擎...')
      await new Promise((r) => setTimeout(r, 400))
      setPhase('全网扫描中，提取候选域名...')

      const res = await fetch('/api/leads/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, industry, country, limit }),
      })

      setPhase('去重、过滤、写入线索库...')
      await new Promise((r) => setTimeout(r, 300))

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Discovery failed')
      }

      const data: DiscoverResult = await res.json()
      setResult(data)
      setPhase('')
    } catch (err: any) {
      setError(err.message || 'Unknown error')
      setPhase('')
    } finally {
      setLoading(false)
    }
  }

  function applyPreset(preset: typeof KEYWORD_PRESETS[0]) {
    setKeyword(preset.value)
    setCountry(preset.country)
    setIndustry('')
  }

  return (
    <div className="flex-1 p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ScanSearch className="h-6 w-6 text-primary" />
            智能挖客
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            输入关键词，SerpAPI + Exa + Tavily 三路并发全网扫描，自动发现潜在客户并写入线索库
          </p>
        </div>
        {result && (
          <div className="flex gap-3 text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <div className="text-xl font-bold text-green-700">{result.created}</div>
              <div className="text-xs text-green-600">新增线索</div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <div className="text-xl font-bold text-blue-700">{result.discovered}</div>
              <div className="text-xs text-blue-600">发现域名</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <div className="text-xl font-bold text-gray-700">{result.skipped}</div>
              <div className="text-xs text-gray-500">已存在跳过</div>
            </div>
          </div>
        )}
      </div>

      {/* Search Panel */}
      <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">

        {/* Main keyword input */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 h-11 text-base"
              placeholder='例如：European CNC distributors  /  Shopify furniture retailers US'
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleDiscover()}
            />
          </div>
          <Button
            size="lg"
            onClick={handleDiscover}
            disabled={loading || !keyword.trim()}
            className="h-11 px-6 gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {loading ? '扫描中...' : '开始扫描'}
          </Button>
        </div>

        {/* Filters row */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[160px]">
            <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
            <select
              className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>{i || '行业（可选）'}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[160px]">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            <select
              className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c || '国家/地区（可选）'}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">最多发现</span>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
            >
              {[10, 20, 30, 50].map((n) => (
                <option key={n} value={n}>{n} 家</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs text-muted-foreground">快速模板：</span>
          {KEYWORD_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className="text-xs px-2.5 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-xl border shadow-sm p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Zap className="absolute inset-0 m-auto h-6 w-6 text-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="font-medium text-gray-900">{phase}</p>
            <p className="text-sm text-muted-foreground">
              三路搜索引擎并发扫描，通常需要 10-20 秒...
            </p>
          </div>
          {/* Source indicators */}
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            {['SerpAPI (Google)', 'Exa Neural', 'Tavily AI'].map((s) => (
              <div key={s} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">

          {/* Search summary bar */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 flex items-center gap-4 text-sm text-blue-700 flex-wrap">
            <span className="font-medium">搜索引擎命中：</span>
            <span>SerpAPI <strong>{result.searchSummary.serpApi}</strong> 条</span>
            <span>Exa <strong>{result.searchSummary.exa}</strong> 条</span>
            {result.searchSummary.tavilyContext && (
              <span>Tavily AI 摘要 <strong>已生成</strong></span>
            )}
            <span className="ml-auto text-blue-500 text-xs">
              后台丰富化进行中（PDL / Hunter / BuiltWith）...
            </span>
          </div>

          {/* No results */}
          {result.leads.length === 0 && (
            <div className="bg-white rounded-xl border shadow-sm p-10 text-center text-muted-foreground">
              <ScanSearch className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">未发现新线索</p>
              <p className="text-sm mt-1">
                {result.skipped > 0
                  ? `找到 ${result.discovered} 家公司，但全部已在您的线索库中。`
                  : '尝试换一个更具体的关键词，或调整行业/国家筛选条件。'}
              </p>
            </div>
          )}

          {/* Lead cards */}
          {result.leads.length > 0 && (
            <div className="grid gap-3">
              {result.leads.map((lead, idx) => (
                <div
                  key={lead.id}
                  className={cn(
                    'bg-white rounded-xl border shadow-sm p-4 flex items-start gap-4',
                    'hover:border-primary/40 hover:shadow-md transition-all'
                  )}
                >
                  {/* Rank */}
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>

                  {/* Favicon */}
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${lead.domain}&sz=32`}
                    alt=""
                    className="w-8 h-8 rounded-md border bg-gray-50 object-contain shrink-0 mt-0.5"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                          {lead.companyName}
                        </h3>
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-0.5"
                        >
                          <Globe className="h-3 w-3" />
                          {lead.domain}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 text-green-600 border-green-200 bg-green-50">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                        已入库
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
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
                      <span className="flex items-center gap-1 text-xs text-blue-500">
                        <Tag className="h-3 w-3" />
                        后台丰富化中
                      </span>
                    </div>
                  </div>

                  {/* View arrow */}
                  <a
                    href={`/leads/${lead.id}`}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary shrink-0 mt-1"
                  >
                    查看
                    <ChevronRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Go to leads CTA */}
          {result.created > 0 && (
            <div className="flex justify-center pt-2">
              <a
                href="/leads"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
              >
                前往线索库查看全部 {result.created} 条新线索
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
