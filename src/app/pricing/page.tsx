'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Minus, Zap, ArrowRight, Sparkles, Shield, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PLANS, CREDIT_COSTS, CREDIT_PACKS } from '@/lib/credits/config'

// ───── Feature comparison rows ─────
const FEATURE_ROWS = [
  { label: 'Monthly credits', starter: '300', growth: '1,200', scale: '4,000' },
  { label: 'Lead discovery (per result)', starter: '2 cr', growth: '2 cr', scale: '2 cr' },
  { label: 'Company enrichment (full)', starter: '5 cr', growth: '5 cr', scale: '5 cr' },
  { label: 'Email verification', starter: '1 cr', growth: '1 cr', scale: '1 cr' },
  { label: 'AI cold email generation', starter: '3 cr', growth: '3 cr', scale: '3 cr' },
  { label: 'Similar company finder (10x)', starter: '10 cr', growth: '10 cr', scale: '10 cr' },
  { label: 'Intent monitoring (per domain/mo)', starter: '3 cr', growth: '3 cr', scale: '3 cr' },
  { label: 'Overage rate', starter: '$0.25/cr', growth: '$0.18/cr', scale: '$0.12/cr' },
  { label: 'Team seats', starter: '1', growth: '3', scale: '10' },
  { label: 'Intent domains', starter: '10', growth: '50', scale: '200' },
  { label: 'CRM integrations', starter: false, growth: true, scale: true },
  { label: 'API access', starter: false, growth: false, scale: true },
  { label: 'Priority support', starter: false, growth: false, scale: true },
  { label: 'Credits never expire', starter: true, growth: true, scale: true },
]

function FeatureCell({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="h-5 w-5 text-emerald-500 mx-auto" />
    ) : (
      <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" />
    )
  }
  return <span className="text-sm font-medium">{value}</span>
}

export default function PricingPage() {
  const [yearly, setYearly] = useState(false)

  function handleGetStarted(planId: string) {
    window.location.href = `/register?plan=${planId}`
  }

  async function handleBuyPack(packId: string) {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId: packId }),
    })
    const { checkoutUrl } = await res.json()
    if (checkoutUrl) window.location.href = checkoutUrl
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Nav ─── */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-[oklch(0.65_0.28_25)] flex items-center justify-center">
              <img src="/logo.svg" alt="ViciVidi" className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">ViciVidi AI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-gradient-to-r from-primary to-[oklch(0.65_0.28_25)] hover:opacity-90">
                Start free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* ─── Hero ─── */}
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 gap-1.5 px-3 py-1 text-xs font-medium border-primary/30 text-primary">
            <Zap className="h-3 w-3" />
            50 free credits on signup — no card required
          </Badge>
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Simple, credit-based pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Pay for what you use. Credits never expire. Scale up or down anytime.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-muted rounded-full p-1.5">
            <button
              onClick={() => setYearly(false)}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-medium transition-all',
                !yearly ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={cn(
                'px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
                yearly ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
              )}
            >
              Yearly
              <span className="text-[11px] font-bold bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* ─── Plan cards ─── */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {PLANS.map((plan) => {
            const price = yearly ? plan.yearlyPriceCents : plan.monthlyPriceCents
            const priceStr = `$${Math.round(price / 100)}`

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-2xl border-2 p-8 flex flex-col gap-6 transition-shadow hover:shadow-xl',
                  plan.highlighted
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                    : 'border-border bg-card'
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-[oklch(0.65_0.28_25)] text-white px-4 py-1 text-xs font-bold shadow-lg">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                {/* Plan header */}
                <div>
                  <div className="font-bold text-xl mb-1">{plan.name}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-extrabold tracking-tight">{priceStr}</span>
                  <span className="text-muted-foreground mb-1.5 text-sm">/mo{yearly ? ' · billed yearly' : ''}</span>
                </div>

                {/* Credits highlight */}
                <div className={cn(
                  'rounded-xl p-4',
                  plan.highlighted ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-sm">
                      {plan.monthlyCredits.toLocaleString()} credits/month
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Overage: ${(plan.overagePriceCents / 100).toFixed(2)}/credit · Credits never expire
                  </p>
                </div>

                {/* Key limits */}
                <ul className="space-y-2.5 flex-1">
                  {[
                    `${plan.limits.teamSeats} team seat${plan.limits.teamSeats > 1 ? 's' : ''}`,
                    `${plan.limits.intentDomains} intent domains`,
                    plan.limits.crmIntegrations ? 'CRM integrations' : null,
                    plan.limits.apiAccess ? 'API access' : null,
                    plan.limits.prioritySupport ? 'Priority support' : null,
                  ]
                    .filter(Boolean)
                    .map((item) => (
                      <li key={item as string} className="flex items-center gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                </ul>

                <Button
                  onClick={() => handleGetStarted(plan.id)}
                  className={cn(
                    'w-full gap-2 font-semibold',
                    plan.highlighted
                      ? 'bg-gradient-to-r from-primary to-[oklch(0.65_0.28_25)] text-white hover:opacity-90'
                      : ''
                  )}
                  variant={plan.highlighted ? 'default' : 'outline'}
                >
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>

        {/* ─── Credit cost table ─── */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">What costs what</h2>
            <p className="text-muted-foreground">Every action deducts credits from your balance. No hidden fees.</p>
          </div>
          <div className="max-w-2xl mx-auto rounded-2xl border bg-card overflow-hidden">
            {Object.entries(CREDIT_COSTS).map(([key, cost], i) => {
              const labels: Record<string, { label: string; desc: string }> = {
                DISCOVER_LEAD: { label: 'Lead discovery', desc: 'Per lead found via keyword search' },
                ENRICH_COMPANY: { label: 'Company enrichment', desc: 'Full profile: PDL + BuiltWith + Hunter' },
                VERIFY_EMAIL: { label: 'Email verification', desc: 'Per email validated via Hunter.io' },
                INTENT_MONITOR: { label: 'Intent monitoring', desc: 'Per domain, per month' },
                EXPORT_LEAD: { label: 'Lead export', desc: 'Per row exported to CSV or CRM' },
                COLD_EMAIL: { label: 'AI cold email', desc: 'Per personalized email generated' },
                FIND_SIMILAR: { label: 'Similar companies', desc: 'Batch of 10 similar prospects' },
              }
              const meta = labels[key]
              if (!meta) return null
              return (
                <div
                  key={key}
                  className={cn(
                    'flex items-center justify-between px-6 py-4',
                    i !== 0 && 'border-t'
                  )}
                >
                  <div>
                    <div className="font-medium text-sm">{meta.label}</div>
                    <div className="text-xs text-muted-foreground">{meta.desc}</div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                    <Zap className="h-3 w-3 text-amber-500" />
                    <span className="text-sm font-bold text-amber-700">{cost} cr</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ─── Feature comparison table ─── */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">Full comparison</h2>
          </div>
          <div className="rounded-2xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-6 py-4 font-semibold w-1/2">Feature</th>
                  {PLANS.map((p) => (
                    <th key={p.id} className="text-center px-4 py-4 font-semibold">
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_ROWS.map((row, i) => (
                  <tr key={row.label} className={cn('border-t', i % 2 === 0 ? '' : 'bg-muted/20')}>
                    <td className="px-6 py-3 text-muted-foreground">{row.label}</td>
                    <td className="px-4 py-3 text-center"><FeatureCell value={row.starter} /></td>
                    <td className="px-4 py-3 text-center"><FeatureCell value={row.growth} /></td>
                    <td className="px-4 py-3 text-center"><FeatureCell value={row.scale} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Credit packs ─── */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-2">Need more credits?</h2>
            <p className="text-muted-foreground">One-time top-up packs. Credits never expire.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.id}
                className={cn(
                  'relative rounded-xl border p-6 flex flex-col gap-4 hover:shadow-md transition-shadow',
                  pack.highlighted ? 'border-primary/50 bg-primary/5' : 'bg-card'
                )}
              >
                {pack.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs">
                    Best value
                  </Badge>
                )}
                <div>
                  <div className="font-semibold mb-0.5">{pack.name}</div>
                  <div className="text-3xl font-extrabold">
                    ${Math.round(pack.priceCents / 100)}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold">{pack.credits.toLocaleString()} credits</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  ${(pack.priceCents / 100 / pack.credits).toFixed(3)}/credit
                </div>
                <Badge variant="secondary" className="w-fit text-emerald-700 bg-emerald-50 border-emerald-200">
                  Save {pack.savingsPct}% vs overage
                </Badge>
                <Button
                  variant={pack.highlighted ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleBuyPack(pack.id)}
                  className={pack.highlighted ? 'bg-gradient-to-r from-primary to-[oklch(0.65_0.28_25)] hover:opacity-90' : ''}
                >
                  Buy now
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Trust signals ─── */}
        <div className="grid sm:grid-cols-3 gap-6 mb-20">
          {[
            {
              icon: Shield,
              title: 'Secure payments',
              desc: 'Powered by Stripe. Your payment info never touches our servers.',
            },
            {
              icon: Clock,
              title: 'Credits never expire',
              desc: 'Unused credits roll over forever. No pressure to use them up.',
            },
            {
              icon: Zap,
              title: 'Cancel anytime',
              desc: 'No lock-in. Pause or cancel your subscription with one click.',
            },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 p-6 rounded-xl border bg-card">
              <div className="p-2 rounded-lg bg-primary/10 h-fit">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold mb-1">{item.title}</div>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Enterprise CTA ─── */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-10 text-center">
          <h2 className="text-2xl font-bold mb-2">Need a custom plan?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Processing &gt;10,000 leads/month or need dedicated infrastructure? Let&apos;s talk.
          </p>
          <Button variant="outline" size="lg" onClick={() => window.location.href = 'mailto:sales@vicividi.com'}>
            Contact sales
          </Button>
        </div>
      </div>
    </div>
  )
}
