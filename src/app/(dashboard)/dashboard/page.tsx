'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Building2,
  Target,
  TrendingUp,
  Zap,
  ScanSearch,
  ArrowRight,
  Globe,
  Mail,
  Activity,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface DashboardStats {
  totalLeads: number
  newLeadsThisMonth: number
  totalCompanies: number
  enrichedCompanies: number
  creditsRemaining: number
  creditsAllocated: number
  planName: string
  hasSubscription: boolean
  recentLeads: Array<{
    id: string
    companyName: string
    domain: string | null
    country: string | null
    status: string
    createdAt: string
  }>
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  REVIEWING: 'bg-amber-100 text-amber-700',
  QUALIFIED: 'bg-emerald-100 text-emerald-700',
  IMPORTED: 'bg-purple-100 text-purple-700',
  CONTACTED: 'bg-orange-100 text-orange-700',
  CONVERTED: 'bg-green-100 text-green-700',
}

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/leads?limit=5').then((r) => r.json()).catch(() => ({ leads: [], total: 0 })),
      fetch('/api/credits/balance').then((r) => r.json()).catch(() => null),
      fetch('/api/companies?limit=1').then((r) => r.json()).catch(() => ({ total: 0 })),
    ]).then(([leadsData, creditsData, companiesData]) => {
      setStats({
        totalLeads: leadsData.total ?? 0,
        newLeadsThisMonth: leadsData.newThisMonth ?? 0,
        totalCompanies: companiesData.total ?? 0,
        enrichedCompanies: companiesData.enriched ?? 0,
        creditsRemaining: creditsData?.balance ?? 0,
        creditsAllocated: 300,
        planName: creditsData?.plan ?? 'Free Trial',
        hasSubscription: creditsData?.hasSubscription ?? false,
        recentLeads: leadsData.leads?.slice(0, 5) ?? [],
      })
    }).finally(() => setLoading(false))
  }, [])

  const creditPct = stats
    ? Math.min(100, Math.round((stats.creditsRemaining / Math.max(stats.creditsAllocated, 1)) * 100))
    : 0

  const enrichPct = stats && stats.totalCompanies > 0
    ? Math.round((stats.enrichedCompanies / stats.totalCompanies) * 100)
    : 0

  const statCards = stats
    ? [
        {
          title: 'Total leads',
          value: stats.totalLeads.toLocaleString(),
          sub: `+${stats.newLeadsThisMonth} this month`,
          icon: Target,
          color: 'from-blue-500/10 to-transparent',
          iconColor: 'from-blue-500 to-cyan-500',
          href: '/leads',
        },
        {
          title: 'Companies tracked',
          value: stats.totalCompanies.toLocaleString(),
          sub: `${enrichPct}% enriched`,
          icon: Building2,
          color: 'from-violet-500/10 to-transparent',
          iconColor: 'from-violet-500 to-purple-500',
          href: '/companies',
        },
        {
          title: 'Credits remaining',
          value: stats.creditsRemaining.toLocaleString(),
          sub: stats.planName,
          icon: Zap,
          color: 'from-amber-500/10 to-transparent',
          iconColor: 'from-amber-500 to-orange-500',
          href: '/billing',
        },
        {
          title: 'Enrichment rate',
          value: `${enrichPct}%`,
          sub: 'Target: 80%',
          icon: TrendingUp,
          color: 'from-emerald-500/10 to-transparent',
          iconColor: 'from-emerald-500 to-green-500',
          href: '/analytics',
        },
      ]
    : []

  return (
    <div className="space-y-6">
      {/* ── Welcome banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/12 via-primary/6 to-transparent p-6 border">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-[oklch(0.55_0.30_320)] to-[oklch(0.65_0.28_25)] bg-clip-text text-transparent">
            {t('overview')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('welcome')}</p>
        </div>
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-gradient-to-br from-primary/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted rounded w-24" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-16 mb-1" />
                  <div className="h-3 bg-muted rounded w-20" />
                </CardContent>
              </Card>
            ))
          : statCards.map((s) => {
              const Icon = s.icon
              return (
                <Link href={s.href} key={s.title}>
                  <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-200 cursor-pointer">
                    <div className={cn(
                      'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity',
                      s.color
                    )} />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {s.title}
                      </CardTitle>
                      <div className={cn(
                        'p-1.5 rounded-lg bg-gradient-to-br shadow-sm',
                        s.iconColor
                      )}>
                        <Icon className="h-3.5 w-3.5 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="text-2xl font-bold">{s.value}</div>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
      </div>

      {/* ── Middle row ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Credit usage card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Credit usage</CardTitle>
              <Badge variant="outline" className="text-xs gap-1">
                <Zap className="h-3 w-3 text-amber-500" />
                {stats?.planName ?? '—'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-semibold">
                {(stats?.creditsRemaining ?? 0).toLocaleString()} / {(stats?.creditsAllocated ?? 300).toLocaleString()}
              </span>
            </div>
            <Progress value={creditPct} className="h-2" />
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <ScanSearch className="h-3 w-3" />
                2 cr per lead found
              </div>
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                5 cr per enrichment
              </div>
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                1 cr per email verify
              </div>
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                3 cr per intent domain
              </div>
            </div>
            <Link href="/billing">
              <Button variant="outline" size="sm" className="w-full gap-2 mt-1">
                Top up credits
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              {
                href: '/discover',
                icon: ScanSearch,
                label: 'Discover new leads',
                desc: 'Keyword-driven, 3-engine search',
                color: 'text-primary',
                bg: 'bg-primary/8 hover:bg-primary/15',
              },
              {
                href: '/leads',
                icon: Target,
                label: 'Manage pipeline',
                desc: 'Review and qualify your leads',
                color: 'text-blue-600',
                bg: 'bg-blue-50 hover:bg-blue-100',
              },
              {
                href: '/intent-dashboard',
                icon: Activity,
                label: 'View intent signals',
                desc: 'See who is showing buying intent',
                color: 'text-violet-600',
                bg: 'bg-violet-50 hover:bg-violet-100',
              },
            ].map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl transition-colors',
                    action.bg
                  )}
                >
                  <div className={cn('shrink-0', action.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold leading-tight">{action.label}</div>
                    <div className="text-xs text-muted-foreground">{action.desc}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent leads ── */}
      {stats && stats.recentLeads.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent leads</CardTitle>
              <Link href="/leads">
                <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentLeads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                    {lead.domain ? (
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${lead.domain}&sz=32`}
                        alt=""
                        className="w-5 h-5"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      lead.companyName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{lead.companyName}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {lead.domain ?? ''}{lead.country ? ` · ${lead.country}` : ''}
                    </div>
                  </div>
                  <Badge className={cn('text-[10px] shrink-0', STATUS_COLORS[lead.status] ?? 'bg-muted text-muted-foreground')}>
                    {lead.status}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── No leads CTA ── */}
      {stats && stats.totalLeads === 0 && !loading && (
        <Card className="border-dashed border-2 text-center p-10">
          <ScanSearch className="h-12 w-12 text-primary/40 mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-1">Start discovering leads</h3>
          <p className="text-muted-foreground text-sm mb-5">
            Use keyword search to find overseas buyers in seconds.
          </p>
          <Link href="/discover">
            <Button className="bg-gradient-to-r from-primary to-[oklch(0.65_0.28_25)] hover:opacity-90 gap-2">
              <ScanSearch className="h-4 w-4" />
              Try Smart Discovery
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
