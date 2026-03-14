'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  MousePointerClick,
  Mail,
  Phone,
  Star,
  AlertTriangle,
  Clock,
  Target,
  Zap,
  Flame,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface IntentSignal {
  id: string
  companyName: string
  domain: string
  signalType: 'page_view' | 'pricing_view' | 'demo_request' | 'feature_usage' | 'email_open' | 'email_click'
  intensity: number
  score: number
  timestamp: string
  status: 'new' | 'reviewed' | 'actioned'
}

interface IntentScore {
  companyId: string
  companyName: string
  domain: string
  totalScore: number
  scoreLevel: 'low' | 'medium' | 'high' | 'critical'
  signalCount: number
  recentSignals: number
  trend: 'up' | 'down' | 'stable'
  topSignals: Array<{
    type: string
    score: number
    timestamp: string
  }>
}

// 模拟数据
const MOCK_INTENT_SCORES: IntentScore[] = [
  {
    companyId: '1',
    companyName: 'Acme Corporation',
    domain: 'acme.com',
    totalScore: 285,
    scoreLevel: 'critical',
    signalCount: 24,
    recentSignals: 12,
    trend: 'up',
    topSignals: [
      { type: 'demo_request', score: 50, timestamp: '2 小时前' },
      { type: 'pricing_view', score: 30, timestamp: '3 小时前' },
      { type: 'page_view', score: 10, timestamp: '5 小时前' },
    ],
  },
  {
    companyId: '2',
    companyName: 'TechStart Inc',
    domain: 'techstart.io',
    totalScore: 156,
    scoreLevel: 'high',
    signalCount: 15,
    recentSignals: 8,
    trend: 'up',
    topSignals: [
      { type: 'pricing_view', score: 30, timestamp: '1 小时前' },
      { type: 'feature_usage', score: 25, timestamp: '4 小时前' },
    ],
  },
  {
    companyId: '3',
    companyName: 'Global Solutions',
    domain: 'globalsolutions.com',
    totalScore: 78,
    scoreLevel: 'medium',
    signalCount: 8,
    recentSignals: 3,
    trend: 'stable',
    topSignals: [
      { type: 'page_view', score: 10, timestamp: '6 小时前' },
    ],
  },
]

const MOCK_SIGNALS: IntentSignal[] = [
  { id: '1', companyName: 'Acme Corporation', domain: 'acme.com', signalType: 'demo_request', intensity: 0.9, score: 50, timestamp: '10 分钟前', status: 'new' },
  { id: '2', companyName: 'TechStart Inc', domain: 'techstart.io', signalType: 'pricing_view', intensity: 0.7, score: 30, timestamp: '25 分钟前', status: 'new' },
  { id: '3', companyName: 'Acme Corporation', domain: 'acme.com', signalType: 'pricing_view', intensity: 0.7, score: 30, timestamp: '1 小时前', status: 'reviewed' },
  { id: '4', companyName: 'Global Solutions', domain: 'globalsolutions.com', signalType: 'page_view', intensity: 0.3, score: 10, timestamp: '2 小时前', status: 'reviewed' },
  { id: '5', companyName: 'Innovation Labs', domain: 'innovationlabs.ai', signalType: 'email_click', intensity: 0.5, score: 15, timestamp: '3 小时前', status: 'actioned' },
]

const SCORE_LEVEL_CONFIG = {
  low: { label: '低', color: 'text-gray-600', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: Activity },
  medium: { label: '中', color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Target },
  high: { label: '高', color: 'text-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: Flame },
  critical: { label: '紧急', color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertTriangle },
}

const SIGNAL_TYPE_CONFIG = {
  page_view: { label: '页面浏览', icon: Eye, color: 'text-blue-500' },
  pricing_view: { label: '查看价格', icon: Target, color: 'text-orange-500' },
  demo_request: { label: '演示请求', icon: Star, color: 'text-red-500' },
  feature_usage: { label: '功能使用', icon: Zap, color: 'text-purple-500' },
  email_open: { label: '邮件打开', icon: Mail, color: 'text-green-500' },
  email_click: { label: '邮件点击', icon: MousePointerClick, color: 'text-teal-500' },
}

export default function IntentDashboardPage() {
  const [intentScores] = useState<IntentScore[]>(MOCK_INTENT_SCORES)
  const [signals] = useState<IntentSignal[]>(MOCK_SIGNALS)

  const stats = {
    total: intentScores.length,
    critical: intentScores.filter(s => s.scoreLevel === 'critical').length,
    high: intentScores.filter(s => s.scoreLevel === 'high').length,
    trending: intentScores.filter(s => s.trend === 'up').length,
  }

  return (
    <div className="space-y-8">
      {/* 头部 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-background p-8 border border-orange-500/20 shadow-glow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-red-500/20 to-transparent rounded-full blur-3xl opacity-30" />
        
        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
            <Flame className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-xs font-medium text-orange-500">Real-time Intent Data</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
            意图数据仪表板
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            实时追踪客户购买意图，识别高意向线索，提升转化率
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">监控公司数</p>
                <p className="text-4xl font-bold">{stats.total}</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">紧急意图</p>
                <p className="text-4xl font-bold text-red-500">{stats.critical}</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">高意向</p>
                <p className="text-4xl font-bold text-orange-500">{stats.high}</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                <Flame className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">上升趋势</p>
                <p className="text-4xl font-bold text-green-500">{stats.trending}</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 意图评分排行榜 */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                意图评分排行榜
              </CardTitle>
              <CardDescription>
                按意图分数排序的公司列表
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              查看全部
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>公司</TableHead>
                <TableHead>意图分数</TableHead>
                <TableHead>等级</TableHead>
                <TableHead>信号数</TableHead>
                <TableHead>近期信号</TableHead>
                <TableHead>趋势</TableHead>
                <TableHead>Top 信号</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {intentScores.map((score) => {
                const config = SCORE_LEVEL_CONFIG[score.scoreLevel]
                const Icon = config.icon
                
                return (
                  <TableRow key={score.companyId} className="hover:bg-primary/5 transition-all duration-200">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-semibold">{score.companyName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {score.domain}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-primary">{score.totalScore}</div>
                        <div className="w-24">
                          <Progress value={Math.min(100, (score.totalScore / 300) * 100)} className="h-2" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${config.bg} ${config.border}`}>
                        <Icon className={`h-3 w-3 mr-1 ${config.color}`} />
                        <span className={config.color}>{config.label}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{score.signalCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                        {score.recentSignals} (7 天)
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {score.trend === 'up' ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <ArrowUpRight className="h-4 w-4" />
                          <span className="text-sm font-medium">上升</span>
                        </div>
                      ) : score.trend === 'down' ? (
                        <div className="flex items-center gap-1 text-red-600">
                          <ArrowDownRight className="h-4 w-4" />
                          <span className="text-sm font-medium">下降</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Activity className="h-4 w-4" />
                          <span className="text-sm font-medium">稳定</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {score.topSignals.slice(0, 2).map((signal, idx) => {
                          const SignalConfig = SIGNAL_TYPE_CONFIG[signal.type as keyof typeof SIGNAL_TYPE_CONFIG]
                          const SignalIcon = SignalConfig?.icon || Activity
                          
                          return (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              <SignalIcon className={`h-3 w-3 ${SignalConfig?.color}`} />
                              <span className="text-muted-foreground">{signal.score}分</span>
                              <span className="text-muted-foreground/70">{signal.timestamp}</span>
                            </div>
                          )
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 实时信号流 */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                实时意图信号
              </CardTitle>
              <CardDescription>
                最新的客户行为信号
              </CardDescription>
            </div>
            <Badge variant="outline" className="animate-pulse">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
              实时更新
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {signals.map((signal) => {
              const SignalConfig = SIGNAL_TYPE_CONFIG[signal.signalType]
              const SignalIcon = SignalConfig?.icon || Eye
              
              return (
                <div 
                  key={signal.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-primary/10 hover:bg-primary/5 transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${SignalConfig?.color.replace('text-', 'from-')}/10 to-${SignalConfig?.color.replace('text-', 'from-')}/5 border border-${SignalConfig?.color.replace('text-', 'from-')}/20`}>
                      <SignalIcon className={`h-5 w-5 ${SignalConfig?.color}`} />
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">{signal.companyName}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {SignalConfig?.label}
                        </Badge>
                        <span>•</span>
                        <span>{signal.timestamp}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right space-y-1">
                      <div className="text-lg font-bold text-primary">{signal.score}</div>
                      <div className="text-xs text-muted-foreground">意图分</div>
                    </div>
                    <div className="w-24">
                      <Progress value={signal.intensity * 100} className="h-2" />
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        signal.status === 'new' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                        signal.status === 'reviewed' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                        'bg-purple-500/10 text-purple-600 border-purple-500/20'
                      }
                    >
                      {signal.status === 'new' ? '新' : signal.status === 'reviewed' ? '已查看' : '已处理'}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
