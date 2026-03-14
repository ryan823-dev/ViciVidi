'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  TrendingUp,
  TrendingDown,
  Building2,
  List,
  Mail,
  Zap,
  DollarSign,
  Target,
  RefreshCw,
  Download
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalCompanies: number
    totalLists: number
    totalEmails: number
    apiCalls: number
    totalCost: number
    avgConfidence: number
  }
  trends: {
    companiesGrowth: Array<{ date: string; value: number }>
    apiCallsByDay: Array<{ date: string; value: number }>
    costsByDay: Array<{ date: string; value: number }>
  }
  breakdown: {
    byIndustry: Array<{ name: string; value: number; percentage: number }>
    byCountry: Array<{ name: string; value: number; percentage: number }>
    bySource: Array<{ name: string; value: number; percentage: number }>
  }
  topLists: Array<{ id: string; name: string; count: number; updatedAt: string }>
  recentActivity: {
    thisWeek: number
    lastWeek: number
    growth: number
  }
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState<string>('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics?workspaceId=workspace_id&timeRange=${timeRange}`)
      const result = await response.json()
      
      if (result.success) {
        setAnalytics(result.data)
      } else {
        toast.error('获取分析数据失败')
      }
    } catch (error) {
      console.error('获取分析数据失败:', error)
      toast.error('获取分析数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    toast.success('报告已导出')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">暂无数据</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">数据分析</h1>
          <p className="text-muted-foreground mt-1">深入了解您的业务数据和使用情况</p>
        </div>
        <div className="flex gap-2">
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
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">公司总数</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalCompanies.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">
                +{analytics.recentActivity.growth.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">较上周</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">列表数量</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalLists}</div>
            <p className="text-xs text-muted-foreground mt-2">
              管理中的列表
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">验证邮箱</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalEmails.toLocaleString()}</div>
            <div className="flex items-center gap-2 mt-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">
                平均置信度 {(analytics.overview.avgConfidence * 100).toFixed(0)}%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API 调用</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.apiCalls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">
              本周期累计
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总成本</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.overview.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              API 支出
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本周活动</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.recentActivity.thisWeek}</div>
            <div className="flex items-center gap-2 mt-2">
              {analytics.recentActivity.growth > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-xs font-medium ${
                analytics.recentActivity.growth > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {analytics.recentActivity.growth > 0 ? '+' : ''}{analytics.recentActivity.growth.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">较上周</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 数据分析 */}
      <Tabs defaultValue="industry" className="space-y-4">
        <TabsList>
          <TabsTrigger value="industry">行业分布</TabsTrigger>
          <TabsTrigger value="country">国家地区</TabsTrigger>
          <TabsTrigger value="source">数据来源</TabsTrigger>
          <TabsTrigger value="lists">热门列表</TabsTrigger>
        </TabsList>

        <TabsContent value="industry" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>按行业分类</CardTitle>
              <CardDescription>
                公司数据的行业分布情况
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.breakdown.byIndustry.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{item.value} 家</span>
                        <span className="text-sm font-medium w-12 text-right">{item.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="country" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>按国家地区分类</CardTitle>
              <CardDescription>
                公司数据的地理分布
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.breakdown.byCountry.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{item.value} 家</span>
                        <span className="text-sm font-medium w-12 text-right">{item.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="source" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>按数据来源分类</CardTitle>
              <CardDescription>
                不同 API 服务的数据贡献
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.breakdown.bySource.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{item.value} 条</span>
                        <span className="text-sm font-medium w-12 text-right">{item.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lists" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>热门列表</CardTitle>
              <CardDescription>
                公司数量最多的列表
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topLists.map((list, index) => (
                  <div key={list.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{list.name}</p>
                        <p className="text-sm text-muted-foreground">
                          更新于 {new Date(list.updatedAt).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <Badge>{list.count} 家公司</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 趋势图表占位 */}
      <Card>
        <CardHeader>
          <CardTitle>增长趋势</CardTitle>
          <CardDescription>
            公司数量增长趋势（按天）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/30">
            <div className="text-center text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>趋势图表区域</p>
              <p className="text-sm">可集成 Recharts 或 Chart.js 实现可视化</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
      {children}
    </span>
  )
}
