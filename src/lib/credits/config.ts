/**
 * ViciVidi AI — Credit System Configuration
 *
 * Centralized source of truth for:
 *   - Feature credit costs
 *   - Subscription plan definitions
 *   - Credit pack definitions
 *
 * Import this wherever credit costs need to be displayed or enforced.
 */

// ───────────────────────────────────────────────
// Feature credit costs
// ───────────────────────────────────────────────

export const CREDIT_COSTS = {
  /** Keyword-driven lead discovery — per lead returned */
  DISCOVER_LEAD: 2,
  /** Full company enrichment (PDL + BuiltWith + Hunter) — per company */
  ENRICH_COMPANY: 5,
  /** Email address verification via Hunter — per email */
  VERIFY_EMAIL: 1,
  /** Intent signal monitoring — per domain, per month */
  INTENT_MONITOR: 3,
  /** Lead export (CSV / CRM sync) — per lead row */
  EXPORT_LEAD: 1,
  /** AI-generated cold email — per email generated */
  COLD_EMAIL: 3,
  /** Similar company discovery via Exa — per batch of 10 */
  FIND_SIMILAR: 10,
} as const

export type CreditFeature = keyof typeof CREDIT_COSTS

// ───────────────────────────────────────────────
// Subscription plans
// ───────────────────────────────────────────────

export interface PlanDefinition {
  id: string
  slug: 'starter' | 'growth' | 'scale'
  name: string
  description: string
  monthlyPriceCents: number  // billed monthly
  yearlyPriceCents: number   // billed yearly (per month equivalent)
  monthlyCredits: number
  overagePriceCents: number  // per credit when quota exhausted
  limits: {
    teamSeats: number
    intentDomains: number
    crmIntegrations: boolean
    apiAccess: boolean
    prioritySupport: boolean
  }
  /** Stripe Price IDs — set via env or Stripe dashboard seeding */
  stripePriceIdMonthly: string
  stripePriceIdYearly: string
  highlighted: boolean
}

export const PLANS: PlanDefinition[] = [
  {
    id: 'plan_starter',
    slug: 'starter',
    name: 'Starter',
    description: 'Perfect for solo foreign trade reps just getting started',
    monthlyPriceCents: 4900,  // $49/mo
    yearlyPriceCents: 3900,   // $39/mo billed annually
    monthlyCredits: 300,
    overagePriceCents: 25,    // $0.25/credit
    limits: {
      teamSeats: 1,
      intentDomains: 10,
      crmIntegrations: false,
      apiAccess: false,
      prioritySupport: false,
    },
    stripePriceIdMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? '',
    stripePriceIdYearly: process.env.STRIPE_PRICE_STARTER_YEARLY ?? '',
    highlighted: false,
  },
  {
    id: 'plan_growth',
    slug: 'growth',
    name: 'Growth',
    description: 'For active exporters who need consistent lead flow',
    monthlyPriceCents: 14900,  // $149/mo
    yearlyPriceCents: 11900,   // $119/mo billed annually
    monthlyCredits: 1200,
    overagePriceCents: 18,     // $0.18/credit
    limits: {
      teamSeats: 3,
      intentDomains: 50,
      crmIntegrations: true,
      apiAccess: false,
      prioritySupport: false,
    },
    stripePriceIdMonthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY ?? '',
    stripePriceIdYearly: process.env.STRIPE_PRICE_GROWTH_YEARLY ?? '',
    highlighted: true,
  },
  {
    id: 'plan_scale',
    slug: 'scale',
    name: 'Scale',
    description: 'For teams and agencies running high-volume outreach',
    monthlyPriceCents: 39900,  // $399/mo
    yearlyPriceCents: 31900,   // $319/mo billed annually
    monthlyCredits: 4000,
    overagePriceCents: 12,     // $0.12/credit
    limits: {
      teamSeats: 10,
      intentDomains: 200,
      crmIntegrations: true,
      apiAccess: true,
      prioritySupport: true,
    },
    stripePriceIdMonthly: process.env.STRIPE_PRICE_SCALE_MONTHLY ?? '',
    stripePriceIdYearly: process.env.STRIPE_PRICE_SCALE_YEARLY ?? '',
    highlighted: false,
  },
]

// ───────────────────────────────────────────────
// Credit add-on packs (one-time purchase)
// ───────────────────────────────────────────────

export interface CreditPack {
  id: string
  name: string
  credits: number
  priceCents: number
  savingsPct: number       // vs Starter overage rate ($0.25)
  highlighted: boolean
  stripePriceId: string
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'pack_200',
    name: 'Starter Pack',
    credits: 200,
    priceCents: 3900,   // $39
    savingsPct: 22,
    highlighted: false,
    stripePriceId: process.env.STRIPE_PRICE_PACK_200 ?? '',
  },
  {
    id: 'pack_800',
    name: 'Growth Pack',
    credits: 800,
    priceCents: 12900,  // $129 → $0.161/credit
    savingsPct: 36,
    highlighted: true,
    stripePriceId: process.env.STRIPE_PRICE_PACK_800 ?? '',
  },
  {
    id: 'pack_2500',
    name: 'Pro Pack',
    credits: 2500,
    priceCents: 34900,  // $349 → $0.14/credit
    savingsPct: 44,
    highlighted: false,
    stripePriceId: process.env.STRIPE_PRICE_PACK_2500 ?? '',
  },
  {
    id: 'pack_8000',
    name: 'Enterprise Pack',
    credits: 8000,
    priceCents: 89900,  // $899 → $0.112/credit
    savingsPct: 55,
    highlighted: false,
    stripePriceId: process.env.STRIPE_PRICE_PACK_8000 ?? '',
  },
]

// ───────────────────────────────────────────────
// Free trial grant
// ───────────────────────────────────────────────

export const FREE_TRIAL_CREDITS = 50

// ───────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────

export function getPlanBySlug(slug: string): PlanDefinition | undefined {
  return PLANS.find((p) => p.slug === slug)
}

export function getPlanById(id: string): PlanDefinition | undefined {
  return PLANS.find((p) => p.id === id)
}

export function getPackById(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id)
}

/** Returns how many units of a feature the given credit balance can afford */
export function affordableUnits(feature: CreditFeature, balance: number): number {
  return Math.floor(balance / CREDIT_COSTS[feature])
}
