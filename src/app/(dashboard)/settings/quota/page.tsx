'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Building2, 
  Mail, 
  FileSpreadsheet, 
  ArrowUpRight, 
  AlertCircle,
  CheckCircle2,
  TrendingUp
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UpgradeDialog } from '@/components/payment/upgrade-dialog'

interface QuotaData {
  plan: 'STARTER' | 'PRO' | 'BUSINESS' | 'ENTERPRISE'
  companies: {
    used: number
    limit: number
    remaining: number
    percentage: number
  }
  emailVerifications: {
    used: number
    limit: number
    remaining: number
    percentage: number
  }
  exports: {
    used: number
    limit: number
    remaining: number
    percentage: number
  }
  periodStart: string
  periodEnd: string
}

const PLAN_FEATURES = {
  STARTER: {
    name: '入门版',
    price: '免费',
    features: ['1,000 家公司', '50 次邮箱验证', '10 次导出', '基础数据丰富'],
  },
  PRO: {
    name: '专业版',
    price: '¥299/月',
    features: ['5,000 家公司', '200 次邮箱验证', '50 次导出', '优先数据丰富', '智能调研'],
  },
  BUSINESS: {
    name: '企业版',
    price: '¥999/月',
    features: ['15,000 家公司', '500 次邮箱验证', '200 次导出', '无限数据丰富', 'API 访问', '团队协作'],
  },
  ENTERPRISE: {
    name: '旗舰版',
    price: '定制',
    features: ['无限公司', '无限邮箱验证', '无限导出', '专属支持', '定制集成', 'SLA 保障'],
  },
}

export default function QuotaPage() {
  const [quota, setQuota] = useState<QuotaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)

  useEffect(() => {
    fetchQuota()
  }, [])

  const fetchQuota = async () => {
    try {
      const response = await fetch('/api/quota')
      if (!response.ok) throw new Error('Failed to fetch quota')
      const data = await response.json()
      setQuota(data)
    } catch (error) {
      console.error('Error fetching quota:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-destructive'
    if (percentage >= 70) return 'bg-orange-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90) {
      return <AlertCircle className="h-5 w-5 text-destructive" />
    }
    if (percentage >= 70) {
      return <AlertCircle className="h-5 w-5 text-orange-500" />
    }
    return <CheckCircle2 className="h-5 w-5 text-green-500" />
  }

  const getUpgradeSuggestion = (percentage: number, resource: string) => {
    if (percentage >= 90) {
      return (
        <div className="flex items-center gap-2 text-destructive text-sm mt-2">
          <AlertCircle className="h-4 w-4" />
          <span>{resource}即将耗尽，建议立即升级</span>
        </div>
      )
    }
    if (percentage >= 70) {
      return (
        <div className="flex items-center gap-2 text-orange-500 text-sm mt-2">
          <AlertCircle className="h-4 w-4" />
          <span>{resource}使用量较高，考虑升级以获得更多额度</span>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <TrendingUp className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">加载配额信息...</p>
        </div>
      </div>
    )
  }

  if (!quota) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
          <p className="text-muted-foreground">加载配额信息失败</p>
          <Button onClick={fetchQuota} className="mt-4">
            重试
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">配额管理</h1>
        <p className="text-muted-foreground mt-1">
          查看你的资源使用情况和套餐详情
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            当前套餐：{PLAN_FEATURES[quota.plan].name}
          </CardTitle>
          <CardDescription>
            计费周期：{new Date(quota.periodStart).toLocaleDateString('zh-CN')} - {new Date(quota.periodEnd).toLocaleDateString('zh-CN')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">套餐价格</p>
              <p className="text-2xl font-bold">{PLAN_FEATURES[quota.plan].price}</p>
            </div>
            <Button onClick={() => setUpgradeDialogOpen(true)}>
              升级套餐
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quota Usage */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Companies */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">公司数量</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quota.companies.limit === -1 ? '无限' : `${quota.companies.used.toLocaleString()} / ${quota.companies.limit.toLocaleString()}`}
            </div>
            {quota.companies.limit !== -1 && (
              <>
                <Progress 
                  value={quota.companies.percentage} 
                  className="mt-2"
                />
                <div className={`flex items-center gap-2 mt-2 ${
                  quota.companies.percentage >= 90 ? 'text-destructive' :
                  quota.companies.percentage >= 70 ? 'text-orange-500' :
                  'text-green-500'
                }`}>
                  {getStatusIcon(quota.companies.percentage)}
                  <span className="text-sm">
                    剩余 {quota.companies.remaining.toLocaleString()}
                  </span>
                </div>
                {getUpgradeSuggestion(quota.companies.percentage, '公司配额')}
              </>
            )}
            {quota.companies.limit === -1 && (
              <p className="text-sm text-green-500 mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                无限额度
              </p>
            )}
          </CardContent>
        </Card>

        {/* Email Verifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">邮箱验证</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quota.emailVerifications.limit === -1 ? '无限' : `${quota.emailVerifications.used} / ${quota.emailVerifications.limit}`}
            </div>
            {quota.emailVerifications.limit !== -1 && (
              <>
                <Progress 
                  value={quota.emailVerifications.percentage} 
                  className="mt-2"
                />
                <div className={`flex items-center gap-2 mt-2 ${
                  quota.emailVerifications.percentage >= 90 ? 'text-destructive' :
                  quota.emailVerifications.percentage >= 70 ? 'text-orange-500' :
                  'text-green-500'
                }`}>
                  {getStatusIcon(quota.emailVerifications.percentage)}
                  <span className="text-sm">
                    剩余 {quota.emailVerifications.remaining}
                  </span>
                </div>
                {getUpgradeSuggestion(quota.emailVerifications.percentage, '邮箱验证配额')}
              </>
            )}
            {quota.emailVerifications.limit === -1 && (
              <p className="text-sm text-green-500 mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                无限额度
              </p>
            )}
          </CardContent>
        </Card>

        {/* Exports */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">导出次数</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quota.exports.limit === -1 ? '无限' : `${quota.exports.used} / ${quota.exports.limit}`}
            </div>
            {quota.exports.limit !== -1 && (
              <>
                <Progress 
                  value={quota.exports.percentage} 
                  className="mt-2"
                />
                <div className={`flex items-center gap-2 mt-2 ${
                  quota.exports.percentage >= 90 ? 'text-destructive' :
                  quota.exports.percentage >= 70 ? 'text-orange-500' :
                  'text-green-500'
                }`}>
                  {getStatusIcon(quota.exports.percentage)}
                  <span className="text-sm">
                    剩余 {quota.exports.remaining}
                  </span>
                </div>
                {getUpgradeSuggestion(quota.exports.percentage, '导出配额')}
              </>
            )}
            {quota.exports.limit === -1 && (
              <p className="text-sm text-green-500 mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                无限额度
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>套餐对比</CardTitle>
          <CardDescription>
            选择适合你的套餐，随时升级
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>功能</TableHead>
                <TableHead>入门版</TableHead>
                <TableHead>专业版</TableHead>
                <TableHead>企业版</TableHead>
                <TableHead>旗舰版</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">公司数量</TableCell>
                <TableCell>1,000</TableCell>
                <TableCell>5,000</TableCell>
                <TableCell>15,000</TableCell>
                <TableCell>无限</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">邮箱验证</TableCell>
                <TableCell>50</TableCell>
                <TableCell>200</TableCell>
                <TableCell>500</TableCell>
                <TableCell>无限</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">导出次数</TableCell>
                <TableCell>10</TableCell>
                <TableCell>50</TableCell>
                <TableCell>200</TableCell>
                <TableCell>无限</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">数据丰富</TableCell>
                <TableCell>基础</TableCell>
                <TableCell>优先</TableCell>
                <TableCell>无限</TableCell>
                <TableCell>无限</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">智能调研</TableCell>
                <TableCell>-</TableCell>
                <TableCell><CheckCircle2 className="h-4 w-4 text-green-500" /></TableCell>
                <TableCell><CheckCircle2 className="h-4 w-4 text-green-500" /></TableCell>
                <TableCell><CheckCircle2 className="h-4 w-4 text-green-500" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">API 访问</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell><CheckCircle2 className="h-4 w-4 text-green-500" /></TableCell>
                <TableCell><CheckCircle2 className="h-4 w-4 text-green-500" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">团队协作</TableCell>
                <TableCell>-</TableCell>
                <TableCell>-</TableCell>
                <TableCell><CheckCircle2 className="h-4 w-4 text-green-500" /></TableCell>
                <TableCell><CheckCircle2 className="h-4 w-4 text-green-500" /></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">价格</TableCell>
                <TableCell className="font-bold">免费</TableCell>
                <TableCell className="font-bold">¥299/月</TableCell>
                <TableCell className="font-bold">¥999/月</TableCell>
                <TableCell className="font-bold">定制</TableCell>
              </TableRow>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>
                  <Button variant={quota.plan === 'STARTER' ? 'default' : 'outline'} size="sm" className="w-full">
                    {quota.plan === 'STARTER' ? '当前套餐' : '升级'}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button variant={quota.plan === 'PRO' ? 'default' : 'outline'} size="sm" className="w-full">
                    {quota.plan === 'PRO' ? '当前套餐' : '升级'}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button variant={quota.plan === 'BUSINESS' ? 'default' : 'outline'} size="sm" className="w-full">
                    {quota.plan === 'BUSINESS' ? '当前套餐' : '升级'}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button variant={quota.plan === 'ENTERPRISE' ? 'default' : 'outline'} size="sm" className="w-full">
                    {quota.plan === 'ENTERPRISE' ? '当前套餐' : '联系'}
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>使用提示</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• 配额按周期计算，周期结束后自动重置</p>
          <p>• 升级套餐后新配额立即生效，已用配额不重置</p>
          <p>• 批量导入公司会消耗公司配额，请提前确认</p>
          <p>• 邮箱验证仅在明确触发时才会消耗配额</p>
          <p>• 导出支持 CSV、Excel、JSON 三种格式</p>
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <UpgradeDialog 
        open={upgradeDialogOpen} 
        onOpenChange={setUpgradeDialogOpen}
        currentPlan={quota.plan}
      />
    </div>
  )
}
