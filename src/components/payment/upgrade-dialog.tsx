'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface UpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlan?: string
}

const PLANS = [
  {
    id: 'PRO',
    name: '专业版',
    price: { monthly: 299, yearly: 2990 },
    description: '适合小型团队',
    features: [
      '5,000 家公司',
      '200 次邮箱验证',
      '50 次导出',
      '优先数据丰富',
      '智能调研',
    ],
    popular: false,
  },
  {
    id: 'BUSINESS',
    name: '企业版',
    price: { monthly: 999, yearly: 9990 },
    description: '适合成长型企业',
    features: [
      '15,000 家公司',
      '500 次邮箱验证',
      '200 次导出',
      '无限数据丰富',
      'API 访问',
      '团队协作',
    ],
    popular: true,
  },
  {
    id: 'ENTERPRISE',
    name: '旗舰版',
    price: { monthly: 2999, yearly: 29990 },
    description: '适合大型组织',
    features: [
      '无限公司',
      '无限邮箱验证',
      '无限导出',
      '专属支持',
      '定制集成',
      'SLA 保障',
    ],
    popular: false,
  },
]

export function UpgradeDialog({ open, onOpenChange, currentPlan }: UpgradeDialogProps) {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)

  const handleUpgrade = async (planId: string) => {
    setLoading(planId)
    try {
      const response = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planId,
          interval,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '升级失败')
      }

      const data = await response.json()

      if (data.mock) {
        // 开发模式
        toast.success(data.message)
        onOpenChange(false)
      } else {
        // 生产模式：跳转到 Stripe 结账
        if (data.url) {
          window.location.href = data.url
        } else {
          throw new Error('未返回支付 URL')
        }
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      toast.error(error instanceof Error ? error.message : '升级失败')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>升级套餐</DialogTitle>
          <DialogDescription>
            选择适合你的套餐，随时升级或取消
          </DialogDescription>
        </DialogHeader>

        {/* Billing Interval Toggle */}
        <div className="flex items-center justify-center gap-4 my-6">
          <Button
            variant={interval === 'monthly' ? 'default' : 'outline'}
            onClick={() => setInterval('monthly')}
          >
            月付
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">省 17%</Badge>
          </div>
          <Button
            variant={interval === 'yearly' ? 'default' : 'outline'}
            onClick={() => setInterval('yearly')}
          >
            年付
          </Button>
        </div>

        {/* Plan Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const price = interval === 'monthly' ? plan.price.monthly : plan.price.yearly
            const isCurrentPlan = currentPlan === plan.id
            const savings = interval === 'yearly' ? plan.price.monthly * 12 - plan.price.yearly : 0

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  plan.popular ? 'border-primary shadow-lg' : ''
                } ${isCurrentPlan ? 'opacity-50' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    最受欢迎
                  </Badge>
                )}

                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="mb-4">
                    <span className="text-3xl font-bold">¥{price}</span>
                    <span className="text-muted-foreground">
                      /{interval === 'monthly' ? '月' : '年'}
                    </span>
                  </div>

                  {savings > 0 && (
                    <p className="text-sm text-green-600 mb-4">
                      年付节省 ¥{savings}
                    </p>
                  )}

                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading === plan.id || isCurrentPlan}
                  >
                    {loading === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        处理中...
                      </>
                    ) : isCurrentPlan ? (
                      '当前套餐'
                    ) : (
                      '立即升级'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        <DialogFooter className="text-sm text-muted-foreground">
          <p>支持支付宝和微信支付 • 随时取消 • 7 天退款保证</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
