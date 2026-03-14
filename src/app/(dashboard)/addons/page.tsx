'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle2, Zap, TrendingUp, FileSpreadsheet, Mail } from 'lucide-react'
import { AddonStore } from '@/components/addons/addon-store'

interface QuotaData {
  plan: string
  emailVerifications: {
    used: number
    limit: number
    remaining: number
    extra: number
  }
  companies: {
    used: number
    limit: number
    remaining: number
  }
  exports: {
    used: number
    limit: number
    remaining: number
  }
}

export default function AddonsPage() {
  const [quota, setQuota] = useState<QuotaData | null>(null)
  const [loading, setLoading] = useState(true)

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
      // 开发模式使用模拟数据
      setQuota({
        plan: 'STARTER',
        emailVerifications: {
          used: 12,
          limit: 50,
          remaining: 38,
          extra: 0,
        },
        companies: {
          used: 127,
          limit: 1000,
          remaining: 873,
        },
        exports: {
          used: 3,
          limit: 10,
          remaining: 7,
        },
      })
    } finally {
      setLoading(false)
    }
  }

  const getUsagePercentage = (used: number, limit: number): number => {
    if (limit === -1) return 0
    return Math.min(100, Math.round((used / limit) * 100))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Zap className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">加载增值商店...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">增值商店</h1>
        <p className="text-muted-foreground mt-1">
          按需购买额外配额，灵活扩展你的使用额度
        </p>
      </div>

      {/* Current Usage */}
      <Card>
        <CardHeader>
          <CardTitle>当前配额状态</CardTitle>
          <CardDescription>
            查看你的配额使用情况，及时补充所需资源
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Verifications */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">邮箱验证</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {quota?.emailVerifications.used} / {quota?.emailVerifications.limit}
                {quota?.emailVerifications.extra! > 0 && (
                  <span className="text-green-600 ml-2">
                    +{quota?.emailVerifications.extra} 额外
                  </span>
                )}
              </div>
            </div>
            <Progress value={getUsagePercentage(quota?.emailVerifications.used || 0, quota?.emailVerifications.limit || 1)} />
            {getUsagePercentage(quota?.emailVerifications.used || 0, quota?.emailVerifications.limit || 1) >= 80 && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span>配额即将耗尽，建议补充</span>
              </div>
            )}
          </div>

          {/* Companies */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">公司数量</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {quota?.companies.used} / {quota?.companies.limit}
              </div>
            </div>
            <Progress value={getUsagePercentage(quota?.companies.used || 0, quota?.companies.limit || 1)} />
            {getUsagePercentage(quota?.companies.used || 0, quota?.companies.limit || 1) >= 80 && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span>配额即将耗尽，建议补充</span>
              </div>
            )}
          </div>

          {/* Exports */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">导出次数</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {quota?.exports.used} / {quota?.exports.limit}
              </div>
            </div>
            <Progress value={getUsagePercentage(quota?.exports.used || 0, quota?.exports.limit || 1)} />
            {getUsagePercentage(quota?.exports.used || 0, quota?.exports.limit || 1) >= 80 && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span>配额即将耗尽，建议补充</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Addon Stores */}
      <AddonStore
        resource="EMAIL_VERIFICATION"
        title="邮箱验证包"
        description="购买额外的邮箱验证次数，用于验证邮箱地址的有效性"
        packages={[
          { amount: 50, price: 50 },
          { amount: 200, price: 180, popular: true },
          { amount: 500, price: 400 },
        ]}
        unit="次"
      />

      <AddonStore
        resource="COMPANY"
        title="公司配额包"
        description="购买额外的公司配额，可以添加更多公司到你的线索库"
        packages={[
          { amount: 1000, price: 100 },
          { amount: 5000, price: 450, popular: true },
          { amount: 10000, price: 800 },
        ]}
        unit="家"
      />

      <AddonStore
        resource="EXPORT"
        title="导出次数包"
        description="购买额外的导出次数，支持 CSV、Excel、JSON 格式"
        packages={[
          { amount: 50, price: 30 },
          { amount: 200, price: 100, popular: true },
          { amount: 500, price: 220 },
        ]}
        unit="次"
      />

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>增值服务特点</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <h3 className="font-medium">即时到账</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                支付成功后配额立即添加到账户，无需等待
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <h3 className="font-medium">永久有效</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                购买的配额无有效期限制，可长期使用
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium">灵活叠加</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                增值配额可与套餐配额叠加使用，灵活组合
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>购买提示</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• 增值包为一次性购买，付款后配额永久有效</p>
          <p>• 批量购买更优惠，推荐选择大包装</p>
          <p>• 配额使用顺序：优先使用套餐内配额，再使用增值配额</p>
          <p>• 支持支付宝和微信支付</p>
          <p>• 如有问题，请联系客服获取帮助</p>
        </CardContent>
      </Card>
    </div>
  )
}
