'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  Users,
  Building2,
  Database,
  DollarSign,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  // 模拟数据 - 实际应从 API 获取
  const userGrowthData = [
    { date: '03-01', users: 12, companies: 45, leads: 230 },
    { date: '03-05', users: 15, companies: 58, leads: 310 },
    { date: '03-10', users: 18, companies: 72, leads: 420 },
    { date: '03-15', users: 23, companies: 95, leads: 580 },
    { date: '03-19', users: 26, companies: 108, leads: 650 },
  ]

  const planDistribution = [
    { name: 'Starter', value: 15, color: '#3b82f6' },
    { name: 'Pro', value: 8, color: '#8b5cf6' },
    { name: 'Business', value: 3, color: '#f59e0b' },
    { name: 'Enterprise', value: 0, color: '#10b981' },
  ]

  const apiUsageData = [
    { service: 'LinkedIn', calls: 1250, cost: 125 },
    { service: 'GitHub', calls: 890, cost: 0 },
    { service: 'Product Hunt', calls: 420, cost: 0 },
    { service: 'AngelList', calls: 380, cost: 0 },
    { service: 'Email Verify', calls: 650, cost: 65 },
  ]

  const stats = [
    {
      title: '总用户数',
      value: '26',
      change: '+12%',
      trend: 'up',
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: '公司总数',
      value: '108',
      change: '+28%',
      trend: 'up',
      icon: Building2,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: '线索总数',
      value: '650',
      change: '+45%',
      trend: 'up',
      icon: Database,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      title: '本月收入',
      value: '¥12,580',
      change: '+18%',
      trend: 'up',
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-500',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">数据分析</h1>
          <p className="text-muted-foreground mt-1">
            查看平台运营数据和增长趋势
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            {timeRange === '7d' ? '最近 7 天' : timeRange === '30d' ? '最近 30 天' : '最近 90 天'}
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm text-green-500 font-medium">
                    {stat.change}
                  </span>
                  <span className="text-sm text-muted-foreground">较上期</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* User Growth */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              增长趋势
            </CardTitle>
            <CardDescription>
              用户、公司、线索数量增长情况
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="用户数"
                  />
                  <Line
                    type="monotone"
                    dataKey="companies"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="公司数"
                  />
                  <Line
                    type="monotone"
                    dataKey="leads"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="线索数"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              套餐分布
            </CardTitle>
            <CardDescription>
              各套餐用户数量占比
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* API Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              API 使用量
            </CardTitle>
            <CardDescription>
              各数据源 API 调用次数
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={apiUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="service" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="calls" fill="#3b82f6" name="调用次数" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Cost Details */}
      <Card>
        <CardHeader>
          <CardTitle>API 成本详情</CardTitle>
          <CardDescription>
            各服务 API 调用成本统计
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiUsageData.map((item) => (
              <div key={item.service} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{item.service}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-sm">
                    <span className="text-muted-foreground">调用次数：</span>
                    <span className="font-medium">{item.calls.toLocaleString()}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">成本：</span>
                    <span className="font-medium">¥{item.cost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
