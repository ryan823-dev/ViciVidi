'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CreditCard,
  Zap,
  TrendingUp,
  History,
  BarChart3,
  Download,
  ExternalLink,
  ShoppingCart,
  ArrowRight,
  Check,
  Sparkles,
} from 'lucide-react'
import { PLANS, CREDIT_PACKS, CREDIT_COSTS } from '@/lib/credits/config'
import { cn } from '@/lib/utils'

interface BillingSummary {
  hasSubscription: boolean
  currentPlan?: {
    name: string
    monthlyCredits: number
    priceCents: number
  }
  credits: {
    totalRemaining: number
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    allocated: number
    consumed: number
  }
  subscription?: {
    status: string
    currentPeriodStart: Date
    currentPeriodEnd: Date
    cancelAtPeriodEnd: boolean
  }
}

interface CreditLedgerEntry {
  id: string
  amount: number
  balanceAfter: number
  type: string
  description: string
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  TRIALING: 'bg-blue-100 text-blue-700 border-blue-200',
  PAST_DUE: 'bg-amber-100 text-amber-700 border-amber-200',
  CANCELED: 'bg-red-100 text-red-700 border-red-200',
}

export default function BillingDashboard() {
  const t = useTranslations('billing')
  const tLedger = useTranslations('billing.creditLedger')
  const tNoSub = useTranslations('billing.noSubscription')

  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<BillingSummary | null>(null)
  const [ledger, setLedger] = useState<CreditLedgerEntry[]>([])

  useEffect(() => {
    loadBillingData()
  }, [])

  async function loadBillingData() {
    try {
      const [summaryRes, ledgerRes] = await Promise.all([
        fetch('/api/billing/summary'),
        fetch('/api/billing/ledger?limit=20'),
      ])
      setSummary(await summaryRes.json())
      const ld = await ledgerRes.json()
      setLedger(ld.entries || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  async function handleBuyCredits(packId: string) {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: packId }),
    })
    const { checkoutUrl } = await res.json()
    if (checkoutUrl) window.location.href = checkoutUrl
  }

  async function handleUpgrade(planId: string) {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    })
    const { checkoutUrl } = await res.json()
    if (checkoutUrl) window.location.href = checkoutUrl
  }

  async function handleManageSubscription() {
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const { portalUrl } = await res.json()
    if (portalUrl) window.location.href = portalUrl
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  const usedPct = summary?.credits.allocated
    ? Math.round((summary.credits.consumed / summary.credits.allocated) * 100)
    : 0
  const remainingPct = summary?.currentPlan?.monthlyCredits
    ? Math.round((summary.credits.totalRemaining / summary.currentPlan.monthlyCredits) * 100)
    : 0

  return (
    <div className="space-y-8 max-w-5xl">
      {/* ─── Page header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-[oklch(0.65_0.28_25)] bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        {summary?.hasSubscription && (
          <Button variant="outline" onClick={handleManageSubscription} className="gap-2 shrink-0">
            <ExternalLink className="w-4 h-4" />
            {t('manageSubscription')}
          </Button>
        )}
      </div>

      {!summary?.hasSubscription ? (
        /* ─── No subscription — show plan picker ─── */
        <div className="space-y-6">
          <Card className="border-dashed border-2 bg-muted/20">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">{tNoSub('title')}</CardTitle>
              <CardDescription className="text-base">{tNoSub('description')}</CardDescription>
            </CardHeader>
            <CardContent className="text-center pt-0 pb-4">
              <Badge variant="outline" className="gap-1 text-primary border-primary/30">
                <Zap className="h-3 w-3" />
                50 free credits included on all plans
              </Badge>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-xl border-2 p-6 flex flex-col gap-4',
                  plan.highlighted ? 'border-primary bg-primary/5' : 'border-border bg-card'
                )}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-[oklch(0.65_0.28_25)] text-white text-[11px]">
                    <Sparkles className="h-2.5 w-2.5 mr-1" />
                    Most Popular
                  </Badge>
                )}
                <div>
                  <div className="font-bold text-lg">{plan.name}</div>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="text-3xl font-extrabold">
                      ${Math.round(plan.monthlyPriceCents / 100)}
                    </span>
                    <span className="text-muted-foreground text-sm mb-1">/mo</span>
                  </div>
                </div>
                <div className={cn(
                  'rounded-lg p-3 text-sm',
                  plan.highlighted ? 'bg-primary/10' : 'bg-muted/50'
                )}>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    {plan.monthlyCredits.toLocaleString()} credits/mo
                  </div>
                </div>
                <ul className="space-y-1.5 text-sm flex-1">
                  {[
                    `${plan.limits.teamSeats} seat${plan.limits.teamSeats > 1 ? 's' : ''}`,
                    `${plan.limits.intentDomains} intent domains`,
                    plan.limits.crmIntegrations && 'CRM integrations',
                    plan.limits.apiAccess && 'API access',
                  ].filter(Boolean).map((f) => (
                    <li key={String(f)} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="text-muted-foreground">{String(f)}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  variant={plan.highlighted ? 'default' : 'outline'}
                  className={cn(
                    'w-full gap-2',
                    plan.highlighted && 'bg-gradient-to-r from-primary to-[oklch(0.65_0.28_25)] hover:opacity-90'
                  )}
                >
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ─── Key metrics ─── */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Current plan */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current plan</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.currentPlan?.name}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ${summary.currentPlan?.priceCents ? Math.round(summary.currentPlan.priceCents / 100) : 0}/mo
                </p>
                <Badge
                  variant="outline"
                  className={cn(
                    'mt-2 text-xs font-medium',
                    STATUS_COLORS[summary.subscription?.status ?? ''] ?? ''
                  )}
                >
                  {summary.subscription?.status ?? 'UNKNOWN'}
                </Badge>
              </CardContent>
            </Card>

            {/* Remaining credits */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Credits remaining</CardTitle>
                <Zap className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.credits.totalRemaining.toLocaleString()}</div>
                <Progress value={remainingPct} className="mt-3 h-1.5" />
                <p className="text-xs text-muted-foreground mt-1.5">
                  {remainingPct}% of monthly quota remaining
                </p>
              </CardContent>
            </Card>

            {/* Period usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">This period</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.credits.consumed.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  / {summary.credits.allocated.toLocaleString()} credits used
                </p>
                <Progress value={usedPct} className="mt-3 h-1.5" />
              </CardContent>
            </Card>
          </div>

          {/* ─── Credit cost reference ─── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Credit usage reference</CardTitle>
              <CardDescription>How many credits each action costs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  { key: 'DISCOVER_LEAD', label: 'Lead discovery (per result)', icon: '🔍' },
                  { key: 'ENRICH_COMPANY', label: 'Company enrichment', icon: '⚡' },
                  { key: 'VERIFY_EMAIL', label: 'Email verification', icon: '✉️' },
                  { key: 'COLD_EMAIL', label: 'AI cold email', icon: '🤖' },
                  { key: 'FIND_SIMILAR', label: 'Similar companies (10x)', icon: '🔗' },
                  { key: 'INTENT_MONITOR', label: 'Intent monitoring /domain/mo', icon: '👁️' },
                  { key: 'EXPORT_LEAD', label: 'Lead export (per row)', icon: '📤' },
                ].map(({ key, label, icon }) => (
                  <div key={key} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 text-sm">
                    <span className="text-muted-foreground">
                      {icon} {label}
                    </span>
                    <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 gap-1">
                      <Zap className="h-2.5 w-2.5" />
                      {CREDIT_COSTS[key as keyof typeof CREDIT_COSTS]} cr
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ─── Buy credit packs ─── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top up your credits</CardTitle>
                  <CardDescription>One-time packs — credits never expire</CardDescription>
                </div>
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {CREDIT_PACKS.map((pack) => (
                  <div
                    key={pack.id}
                    className={cn(
                      'relative rounded-xl border p-4 space-y-3 transition-shadow hover:shadow-md',
                      pack.highlighted ? 'border-primary/50 bg-primary/5' : 'border-border'
                    )}
                  >
                    {pack.highlighted && (
                      <Badge className="absolute -top-2.5 left-3 bg-primary text-primary-foreground text-[10px]">
                        Best value
                      </Badge>
                    )}
                    <div>
                      <div className="text-sm font-semibold">{pack.name}</div>
                      <div className="text-2xl font-extrabold mt-0.5">
                        ${Math.round(pack.priceCents / 100)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      {pack.totalCredits.toLocaleString()} credits
                      {pack.bonusCredits > 0 && (
                        <span className="text-xs text-emerald-600">+{pack.bonusCredits}</span>
                      )}
                    </div>
                    <div className="text-xs text-emerald-600 font-medium">${(pack.unitPriceCents / 100).toFixed(2)}/cr</div>
                    <Button
                      size="sm"
                      variant={pack.highlighted ? 'default' : 'outline'}
                      className={cn(
                        'w-full',
                        pack.highlighted && 'bg-gradient-to-r from-primary to-[oklch(0.65_0.28_25)] hover:opacity-90'
                      )}
                      onClick={() => handleBuyCredits(pack.id)}
                    >
                      Buy
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ─── Credit ledger ─── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{tLedger('title')}</CardTitle>
                  <CardDescription>{tLedger('description')}</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="w-3.5 h-3.5" />
                  {tLedger('exportCsv')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {ledger.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{tLedger('noRecords')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {ledger.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                          entry.amount > 0 ? 'bg-emerald-100' : 'bg-red-100'
                        )}>
                          {entry.amount > 0
                            ? <TrendingUp className="w-4 h-4 text-emerald-600" />
                            : <Zap className="w-4 h-4 text-red-500" />
                          }
                        </div>
                        <div>
                          <div className="text-sm font-medium leading-tight">{entry.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(entry.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={cn(
                          'text-sm font-bold',
                          entry.amount > 0 ? 'text-emerald-600' : 'text-red-500'
                        )}>
                          {entry.amount > 0 ? '+' : ''}{entry.amount}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          bal: {entry.balanceAfter}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
