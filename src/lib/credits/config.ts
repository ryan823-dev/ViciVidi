/**
 * ViciVidi AI — Credit System Configuration
 *
 * Single source of truth for credit costs, plan definitions, and credit packs.
 * Price IDs are hardcoded from Stripe Dashboard (no env vars needed beyond
 * STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET).
 *
 * Yearly billing: UI shows a discounted price, but checkout uses the monthly
 * Price ID — Stripe handles the recurring monthly charge, discount shown as UX only.
 */

// ─────────────────────────────────────────────────────────
// Feature credit costs
// ─────────────────────────────────────────────────────────

export const CREDIT_COSTS = {
  /** Lead discovery — per lead returned by 3-engine search */
  DISCOVER_LEAD: 2,
  /** Full company enrichment (PDL + BuiltWith + Hunter) */
  ENRICH_COMPANY: 5,
  /** Email verification via Hunter.io */
  VERIFY_EMAIL: 1,
  /** Intent signal monitoring — per domain per month */
  INTENT_MONITOR: 3,
  /** Lead export to CSV or CRM — per row */
  EXPORT_LEAD: 1,
  /** AI cold email generation — per email */
  COLD_EMAIL: 3,
  /** Similar company discovery via Exa — per batch of 10 */
  FIND_SIMILAR: 10,
} as const

export type CreditFeature = keyof typeof CREDIT_COSTS

// ─────────────────────────────────────────────────────────
// Subscription plans
// Price IDs come from Stripe Dashboard (already created).
// Only monthly Price IDs exist; yearly is shown as a UI
// discount but routes to the same monthly Price.
// ─────────────────────────────────────────────────────────

export interface PlanDefinition {
  id: string
  slug: 'starter' | 'growth' | 'pro'
  name: string
  description: string
  monthlyPriceCents: number
  yearlyDisplayPriceCents: number  // display only — 20% off
  monthlyCredits: number
  bonusCredits: number             // from Stripe metadata
  overagePriceCents: number        // per extra credit
  limits: {
    teamSeats: number
    intentDomains: number
    crmIntegrations: boolean
    apiAccess: boolean
    prioritySupport: boolean
  }
  stripePriceId: string            // monthly Price ID (used for all checkouts)
  highlighted: boolean
}

export const PLANS: PlanDefinition[] = [
  {
    id: 'plan_starter',
    slug: 'starter',
    name: 'Starter',
    description: '适合外贸新手与个人 SOHO',
    monthlyPriceCents: 4900,
    yearlyDisplayPriceCents: 3900,  // ~$39/mo if yearly existed
    monthlyCredits: 300,
    bonusCredits: 50,               // bonus from Stripe metadata
    overagePriceCents: 25,
    limits: {
      teamSeats: 1,
      intentDomains: 10,
      crmIntegrations: false,
      apiAccess: false,
      prioritySupport: false,
    },
    stripePriceId: 'price_1TBR6QDwu2b3jvrtO0CyLgat',
    highlighted: false,
  },
  {
    id: 'plan_growth',
    slug: 'growth',
    name: 'Growth',
    description: '适合成长型外贸团队（热门）',
    monthlyPriceCents: 14900,
    yearlyDisplayPriceCents: 11900,
    monthlyCredits: 1200,
    bonusCredits: 100,
    overagePriceCents: 18,
    limits: {
      teamSeats: 3,
      intentDomains: 50,
      crmIntegrations: true,
      apiAccess: false,
      prioritySupport: false,
    },
    stripePriceId: 'price_1TBR6QDwu2b3jvrtYZeIICkh',
    highlighted: true,
  },
  {
    id: 'plan_pro',
    slug: 'pro',
    name: 'Pro',
    description: '适合成熟外贸企业',
    monthlyPriceCents: 39900,
    yearlyDisplayPriceCents: 31900,
    monthlyCredits: 4000,
    bonusCredits: 300,
    overagePriceCents: 12,
    limits: {
      teamSeats: 10,
      intentDomains: 200,
      crmIntegrations: true,
      apiAccess: true,
      prioritySupport: true,
    },
    stripePriceId: 'price_1TBR6RDwu2b3jvrtF667u8Y2',
    highlighted: false,
  },
]

// ─────────────────────────────────────────────────────────
// Credit packs (one-time purchase)
// Aligned with your actual Stripe products.
// ─────────────────────────────────────────────────────────

export interface CreditPack {
  id: string
  name: string
  description: string
  credits: number
  bonusCredits: number
  totalCredits: number             // credits + bonusCredits
  priceCents: number
  unitPriceCents: number           // priceCents / totalCredits * 100
  highlighted: boolean
  stripePriceId: string
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'pack_500',
    name: '入门体验',
    description: '快速体验核心功能',
    credits: 500,
    bonusCredits: 0,
    totalCredits: 500,
    priceCents: 4900,             // $49 — based on $0.098/cr from metadata
    unitPriceCents: 10,
    highlighted: false,
    stripePriceId: 'price_1TBR6SDwu2b3jvrtmVxkBKqC',
  },
  {
    id: 'pack_1200',
    name: '1200 Credits',
    description: '最受欢迎（送 100 credits）',
    credits: 1200,
    bonusCredits: 100,
    totalCredits: 1300,
    priceCents: 9900,             // $99 — $0.082/cr base
    unitPriceCents: 8,
    highlighted: true,
    stripePriceId: 'price_1TBR6TDwu2b3jvrtTbKr4Paw',
  },
  {
    id: 'pack_3000',
    name: '3000 Credits',
    description: '超值特惠（送 300 credits）',
    credits: 3000,
    bonusCredits: 300,
    totalCredits: 3300,
    priceCents: 19900,            // $199 — $0.066/cr base
    unitPriceCents: 7,
    highlighted: false,
    stripePriceId: 'price_1TBR6TDwu2b3jvrtV85om4dt',
  },
  {
    id: 'pack_10000',
    name: '10000 Credits',
    description: '企业专享（送 2000 credits）',
    credits: 10000,
    bonusCredits: 2000,
    totalCredits: 12000,
    priceCents: 49900,            // $499 — $0.05/cr base
    unitPriceCents: 5,
    highlighted: false,
    stripePriceId: 'price_1TBR6UDwu2b3jvrtL9uWGDh6',
  },
]

// ─────────────────────────────────────────────────────────
// Free trial
// ─────────────────────────────────────────────────────────

export const FREE_TRIAL_CREDITS = 50

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

export function getPlanBySlug(slug: string): PlanDefinition | undefined {
  return PLANS.find((p) => p.slug === slug)
}

export function getPlanById(id: string): PlanDefinition | undefined {
  return PLANS.find((p) => p.id === id)
}

export function getPackById(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id)
}

export function getPlanByPriceId(priceId: string): PlanDefinition | undefined {
  return PLANS.find((p) => p.stripePriceId === priceId)
}

export function getPackByPriceId(priceId: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.stripePriceId === priceId)
}

export function affordableUnits(feature: CreditFeature, balance: number): number {
  return Math.floor(balance / CREDIT_COSTS[feature])
}
