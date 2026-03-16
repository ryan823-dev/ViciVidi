'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Mail, List, TrendingUp } from 'lucide-react'

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
    },
    {
      title: tStats('emailVerifications'),
      value: '0',
      description: tStats('remaining').replace('{count}', '50'),
      icon: Mail,
    },
    {
      title: tStats('listsCount'),
      value: '0',
      description: tStats('totalLeads').replace('{count}', '0'),
      icon: List,
    },
    {
      title: tStats('enrichmentRate'),
      value: '0%',
      description: tStats('target').replace('{value}', '80%'),
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t('overview')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('welcome')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{tQuickStart('title')}</CardTitle>
            <CardDescription>
              {tQuickStart('description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/companies"
              className="text-primary hover:underline"
            >
              {tQuickStart('addFirst')}
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tQuota('title')}</CardTitle>
            <CardDescription>
              {tQuota('currentPlan')}: Starter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{tQuota('companyCount')}</span>
                <span>0 / 1,000</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary w-0" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}