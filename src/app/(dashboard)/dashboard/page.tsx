'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Mail, List, TrendingUp, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const tStats = useTranslations('dashboard.stats')
  const tQuickStart = useTranslations('dashboard.quickStart')
  const tQuota = useTranslations('dashboard.quotaUsage')

  const stats = [
    {
      title: tStats('totalCompanies'),
      value: '0',
      description: tStats('newThisMonth').replace('{count}', '0'),
      icon: Building2,
      gradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
      iconGradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: tStats('emailVerifications'),
      value: '0',
      description: tStats('remaining').replace('{count}', '50'),
      icon: Mail,
      gradient: 'from-purple-500/10 via-purple-500/5 to-transparent',
      iconGradient: 'from-purple-500 to-pink-500',
    },
    {
      title: tStats('listsCount'),
      value: '0',
      description: tStats('totalLeads').replace('{count}', '0'),
      icon: List,
      gradient: 'from-orange-500/10 via-orange-500/5 to-transparent',
      iconGradient: 'from-orange-500 to-red-500',
    },
    {
      title: tStats('enrichmentRate'),
      value: '0%',
      description: tStats('target').replace('{value}', '80%'),
      icon: TrendingUp,
      gradient: 'from-green-500/10 via-green-500/5 to-transparent',
      iconGradient: 'from-green-500 to-emerald-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 border">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-[oklch(0.55_0.30_320)] to-[oklch(0.65_0.28_25)] bg-clip-text text-transparent">
            {t('overview')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('welcome')}
          </p>
        </div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Stats with gradients */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.iconGradient} shadow-lg`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions with enhanced design */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-[oklch(0.65_0.28_25)]">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle>{tQuickStart('title')}</CardTitle>
                <CardDescription className="mt-1">
                  {tQuickStart('description')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <Button asChild className="w-full bg-gradient-to-r from-primary to-[oklch(0.65_0.28_25)] hover:opacity-90 transition-opacity">
              <a href="/companies" className="flex items-center justify-center gap-2">
                {tQuickStart('addFirst')}
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent" />
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle>{tQuota('title')}</CardTitle>
                <CardDescription className="mt-1">
                  {tQuota('currentPlan')}: <span className="font-semibold text-foreground">Starter</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{tQuota('companyCount')}</span>
                <span className="font-medium">0 / 1,000</span>
              </div>
              <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-[oklch(0.65_0.28_25)] w-0 transition-all duration-500" />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                Start adding companies to track your usage
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}