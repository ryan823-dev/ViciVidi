'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Download,
  RefreshCw,
  Settings,
  Zap,
  Search,
  Globe,
  Mail,
  FileText
} from 'lucide-react'

interface CostData {
  total: {
    cost: number
    credits: number
    requests: number
  }
  breakdown: Array<{
    key: string
    cost: number
    credits: number
    requests: number
    count: number
  }>
  serviceBreakdown: Array<{
    key: string
    cost: number
    credits: number
    requests: number
    count: number
  }>
  period: {
    startDate: string
    endDate: string
  }
}

interface BudgetData {
  id: string
  workspaceId: string
  monthlyLimit: number
  alertThreshold: number
  currentMonthSpending?: number
  resetDate?: string
}

export default function CostsPage() {
  const [loading, setLoading] = useState(true)
  const [costData, setCostData] = useState<CostData | null>(null)
  const [budget, setBudget] = useState<BudgetData | null>(null)
  const [timeRange, setTimeRange] = useState('30d')
  const [groupBy, setGroupBy] = useState('service')
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false)
  const [monthlyLimit, setMonthlyLimit] = useState('1000')
  const [alertThreshold, setAlertThreshold] = useState('80')

  useEffect(() => {
    fetchCostData()
    fetchBudget()
  }, [timeRange])

  const fetchCostData = async () => {
    try {
      setLoading(true)
      const dateRange = getDateRange(timeRange)
      const params = new URLSearchParams()
      params.set('workspaceId', 'workspace_id')
      params.set('groupBy', groupBy)
      if (dateRange.startDate) params.set('startDate', dateRange.startDate)
      if (dateRange.endDate) params.set('endDate', dateRange.endDate)
      
      const response = await fetch(`/api/costs?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setCostData(result.data)
      } else {
        toast.error('获取成本数据失败')
      }
    } catch (error) {
      console.error('获取成本数据失败:', error)
      toast.error('获取成本数据失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchBudget = async () => {
    try {
      const response = await fetch('/api/costs/budget?workspaceId=workspace_id')
      const result = await response.json()
      
      if (result.success && result.data) {
        setBudget(result.data)
        setMonthlyLimit(result.data.monthlyLimit.toString())
        setAlertThreshold(result.data.alertThreshold.toString())
      }
    } catch (error) {
      console.error('获取预算设置失败:', error)
    }
  }

  const handleSaveBudget = async () => {
    try {
      const response = await fetch('/api/costs/budget', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'workspace_id',
          monthlyLimit: parseFloat(monthlyLimit),
          alertThreshold: parseInt(alertThreshold)
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('预算设置已保存')
        setBudgetDialogOpen(false)
        fetchBudget()
      } else {
        toast.error('保存预算失败')
      }
    } catch (error) {
      console.error('保存预算失败:', error)
      toast.error('保存预算失败')
    }
  }

  const handleExport = () => {
    if (!costData) return
    
    const csvContent = generateCSV(costData)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `cost-report-${timeRange}.csv`
    link.click()
    
    toast.success('报告已导出')
  }

  const getDateRange = (range: string) => {
    const now = new Date()
    let startDate = new Date()
    
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case 'all':
        return {}
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    }
  }

  const generateCSV = (data: CostData) => {
    const headers = ['服务/日期', '成本 (USD)', '积分消耗', '请求次数', '调用次数']
    const rows = data.breakdown.map(item => 
      [item.key, item.cost.toFixed(4), item.credits, item.requests, item.count].join(',')
    )
    
    return [headers.join(','), ...rows].join('\n')
  }

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName) {
      case 'Google Places':
        return <Search className="h-4 w-4" />
      case 'Brave Search':
        return <Globe className="h-4 w-4" />
      case 'Hunter.io':
        return <Mail className="h-4 w-4" />
      case 'Firecrawl':
        return <FileText className="h-4 w-4" />
      default:
        return <Zap className="h-4 w-4" />
    }
  }

  const getBudgetPercentage = () => {
    if (!budget || !costData) return 0
    const spending = costData.total.cost
    const limit = budget.monthlyLimit
    return Math.min((spending / limit) * 100, 100)
  }

  const getBudgetStatus = () => {
    const percentage = getBudgetPercentage()
    if (percentage >= 100) return 'danger'
    if (percentage >= (budget?.alertThreshold || 80)) return 'warning'
    return 'normal'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const budgetStatus = getBudgetStatus()

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">成本监控</h1>
          <p className="text-muted-foreground mt-1">追踪 API 调用成本和预算使用情况</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchCostData()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          <Button onClick={() => setBudgetDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            预算设置
          </Button>
        </div>
      </div>

      {/* 预算概览 */}
      {budget && costData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              本月预算使用情况
            </CardTitle>
            <CardDescription>
              预算周期：{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">已使用</p>
                  <p className="text-2xl font-bold">${costData.total.cost.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">总预算</p>
                  <p className="text-2xl font-bold">${budget.monthlyLimit.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">剩余</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${(budget.monthlyLimit - costData.total.cost).toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">使用进度</span>
                  <span className={`font-medium ${
                    budgetStatus === 'danger' ? 'text-red-600' :
                    budgetStatus === 'warning' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {getBudgetPercentage().toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={getBudgetPercentage()} 
                  className={`h-2 ${
                    budgetStatus === 'danger' ? '[&>div]:bg-red-600' :
                    budgetStatus === 'warning' ? '[&>div]:bg-yellow-600' :
                    '[&>div]:bg-green-600'
                  }`}
                />
                {budgetStatus === 'warning' && (
                  <div className="flex items-center gap-2 text-yellow-600 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    支出已达到预算的 {budget.alertThreshold}%，请注意控制
                  </div>
                )}
                {budgetStatus === 'danger' && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    已超出预算上限！
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 成本分析 */}
      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList>
          <TabsTrigger value="breakdown">成本明细</TabsTrigger>
          <TabsTrigger value="services">服务分析</TabsTrigger>
          <TabsTrigger value="trends">趋势分析</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-4">
          <div className="flex gap-4 items-center">
            <Select value={timeRange} onValueChange={(value) => value && setTimeRange(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">最近 7 天</SelectItem>
                <SelectItem value="30d">最近 30 天</SelectItem>
                <SelectItem value="90d">最近 90 天</SelectItem>
                <SelectItem value="all">全部</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={groupBy} onValueChange={(value) => value && setGroupBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service">按服务</SelectItem>
                <SelectItem value="date">按日期</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {groupBy === 'service' ? '按服务分类' : '按日期分类'}
              </CardTitle>
              <CardDescription>
                {timeRange === '7d' ? '最近 7 天' : timeRange === '30d' ? '最近 30 天' : timeRange === '90d' ? '最近 90 天' : '全部'} 的成本数据
              </CardDescription>
            </CardHeader>
            <CardContent>
              {costData && costData.breakdown.length > 0 ? (
                <div className="space-y-4">
                  {costData.breakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {groupBy === 'service' && getServiceIcon(item.key)}
                        <div>
                          <p className="font-medium">{item.key}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.count} 次调用 · {item.requests} 个请求
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">${item.cost.toFixed(4)}</p>
                        <p className="text-sm text-muted-foreground">{item.credits} 积分</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  暂无成本数据
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>服务成本分析</CardTitle>
              <CardDescription>各 API 服务的详细支出情况</CardDescription>
            </CardHeader>
            <CardContent>
              {costData && costData.serviceBreakdown.length > 0 ? (
                <div className="space-y-6">
                  {costData.serviceBreakdown.map((service, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getServiceIcon(service.key)}
                          <span className="font-medium">{service.key}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">${service.cost.toFixed(4)}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({((service.cost / costData.total.cost) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <Progress value={(service.cost / costData.total.cost) * 100} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{service.requests} 请求</span>
                        <span>{service.credits} 积分</span>
                        <span>{service.count} 调用</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  暂无服务数据
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>成本趋势</CardTitle>
              <CardDescription>每日成本变化趋势</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                趋势图表功能开发中...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 汇总统计 */}
      {costData && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总成本</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${costData.total.cost.toFixed(4)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {costData.total.requests} 个请求
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">积分消耗</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{costData.total.credits}</div>
              <p className="text-xs text-muted-foreground mt-1">
                本周期累计
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均成本</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${costData.total.cost > 0 && costData.total.requests > 0 
                  ? (costData.total.cost / costData.total.requests * 1000).toFixed(2)
                  : '0.00'
                }
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                每千次请求
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 预算设置对话框 */}
      <Dialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>预算设置</DialogTitle>
            <DialogDescription>
              设置每月成本预算和警报阈值
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyLimit">月度预算上限 (USD)</Label>
              <Input
                id="monthlyLimit"
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alertThreshold">警报阈值 (%)</Label>
              <Input
                id="alertThreshold"
                type="number"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                placeholder="80"
                min="50"
                max="100"
              />
              <p className="text-xs text-muted-foreground">
                当支出达到预算的 {alertThreshold}% 时触发警报
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBudgetDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveBudget}>
              保存设置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
