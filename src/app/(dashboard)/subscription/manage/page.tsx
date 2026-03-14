'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Calendar,
  CreditCard,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Subscription {
  plan: 'STARTER' | 'PRO' | 'BUSINESS' | 'ENTERPRISE'
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused'
  interval: 'monthly' | 'yearly' | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

const PLANS = {
  STARTER: { name: '入门版', price: '免费' },
  PRO: { name: '专业版', price: '¥299/月' },
  BUSINESS: { name: '企业版', price: '¥999/月' },
  ENTERPRISE: { name: '旗舰版', price: '¥2,999/月' },
}

export default function SubscriptionManagePage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [changeDialogOpen, setChangeDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [changeType, setChangeType] = useState<'immediate' | 'end_of_period'>('end_of_period')
  const [changing, setChanging] = useState(false)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription')
      if (!response.ok) throw new Error('Failed to fetch subscription')
      const data = await response.json()
      setSubscription(data)
    } catch (error) {
      console.error('Error fetching subscription:', error)
      // 开发模式使用模拟数据
      setSubscription({
        plan: 'STARTER',
        status: 'active',
        interval: 'monthly',
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePlan = async (plan: string) => {
    setSelectedPlan(plan)
    setChangeDialogOpen(true)
  }

  const confirmChange = async () => {
    setChanging(true)
    try {
      const response = await fetch('/api/subscription/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPlan: selectedPlan,
          changeType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '切换失败')
      }

      const data = await response.json()
      
      if (data.mock) {
        toast.success(data.message)
      } else {
        toast.success(data.message || '套餐切换成功')
      }
      
      setChangeDialogOpen(false)
      fetchSubscription()
    } catch (error) {
      console.error('Change plan error:', error)
      toast.error(error instanceof Error ? error.message : '切换失败')
    } finally {
      setChanging(false)
    }
  }

  const handleManagePortal = async () => {
    try {
      const response = await fetch('/api/payment/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      })

      if (!response.ok) throw new Error('Failed to create portal session')

      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Portal error:', error)
      toast.error('打开管理门户失败')
    }
  }

  const handleCancel = async () => {
    if (!confirm('确定要取消订阅吗？订阅将在当前周期结束后终止。')) return

    try {
      // TODO: 实现取消 API
      toast.success('订阅已取消，将在当前周期结束后终止')
      fetchSubscription()
    } catch (error) {
      toast.error('取消失败')
    }
  }

  const handleResume = async () => {
    try {
      // TODO: 恢复订阅
      toast.success('订阅已恢复')
      fetchSubscription()
    } catch (error) {
      toast.error('恢复失败')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">加载订阅信息...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">订阅管理</h1>
        <p className="text-muted-foreground mt-1">
          管理你的订阅和账单
        </p>
      </div>

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            当前订阅
          </CardTitle>
          <CardDescription>
            {subscription?.cancelAtPeriodEnd && (
              <Badge variant="destructive" className="mr-2">
                已取消
              </Badge>
            )}
            订阅将在当前周期结束后
            {subscription?.cancelAtPeriodEnd ? '终止' : '继续'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">当前套餐</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-2xl font-bold">{PLANS[subscription!.plan].name}</p>
                <Badge>{subscription!.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {PLANS[subscription!.plan].price}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">计费周期</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">
                  {subscription!.interval === 'monthly' ? '月付' : '年付'}
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                下次续费：{subscription!.currentPeriodEnd ? new Date(subscription!.currentPeriodEnd).toLocaleDateString('zh-CN') : '未知'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleManagePortal} variant="outline">
              <CreditCard className="mr-2 h-4 w-4" />
              管理支付方式
            </Button>
            {subscription!.cancelAtPeriodEnd ? (
              <Button onClick={handleResume} variant="default">
                恢复订阅
              </Button>
            ) : (
              <Button onClick={handleCancel} variant="destructive">
                取消订阅
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Change Plan */}
      <Card>
        <CardHeader>
          <CardTitle>切换套餐</CardTitle>
          <CardDescription>
            选择新的套餐，可以立即生效或周期结束后生效
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>套餐</TableHead>
                <TableHead>价格</TableHead>
                <TableHead>功能亮点</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(PLANS).map(([planId, plan]) => {
                const isCurrentPlan = subscription?.plan === planId
                const isDowngrade = 
                  (subscription?.plan === 'ENTERPRISE' && ['PRO', 'BUSINESS', 'STARTER'].includes(planId)) ||
                  (subscription?.plan === 'BUSINESS' && ['PRO', 'STARTER'].includes(planId)) ||
                  (subscription?.plan === 'PRO' && planId === 'STARTER')

                return (
                  <TableRow key={planId}>
                    <TableCell>
                      <div className="font-medium">{plan.name}</div>
                      {isCurrentPlan && (
                        <Badge variant="secondary" className="mt-1">
                          当前套餐
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{plan.price}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {planId === 'STARTER' && '基础功能'}
                      {planId === 'PRO' && '适合小型团队'}
                      {planId === 'BUSINESS' && '适合成长型企业'}
                      {planId === 'ENTERPRISE' && '适合大型组织'}
                    </TableCell>
                    <TableCell>
                      {!isCurrentPlan && (
                        <Button
                          size="sm"
                          onClick={() => handleChangePlan(planId)}
                          variant={isDowngrade ? 'outline' : 'default'}
                        >
                          切换到{plan.name}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>账单历史</CardTitle>
          <CardDescription>
            查看你的历史账单和付款记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground text-center py-8">
            <p>暂无账单记录</p>
            <p className="mt-2">订阅后，账单将显示在这里</p>
          </div>
        </CardContent>
      </Card>

      {/* Change Dialog */}
      <Dialog open={changeDialogOpen} onOpenChange={setChangeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认切换套餐</DialogTitle>
            <DialogDescription>
              选择切换方式，{(PLANS as any)[selectedPlan]?.name}将
              {changeType === 'immediate' ? '立即生效并按比例计费' : '在当前周期结束后生效'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div
              className={`p-4 rounded-lg border cursor-pointer ${
                changeType === 'end_of_period' ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => setChangeType('end_of_period')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">周期结束后切换</span>
                </div>
                {changeType === 'end_of_period' && (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                当前套餐继续使用至{subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString('zh-CN') : '周期结束'}，新套餐在下一个周期生效
              </p>
            </div>

            <div
              className={`p-4 rounded-lg border cursor-pointer ${
                changeType === 'immediate' ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => setChangeType('immediate')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span className="font-medium">立即切换</span>
                </div>
                {changeType === 'immediate' && (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                新套餐立即生效，费用将按剩余天数比例计算，在下次账单中调整
              </p>
            </div>

            {changeType === 'immediate' && (
              <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <p>立即切换可能会产生按比例的费用调整</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmChange} disabled={changing}>
              {changing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  处理中...
                </>
              ) : (
                '确认切换'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
