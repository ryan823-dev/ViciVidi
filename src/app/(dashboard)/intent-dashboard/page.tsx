'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Clock,
  Target,
  Zap,
  Flame,
  Sparkles,
  ArrowUpRight,
  Minus,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

// ===== 类型定义 =====
interface IntentScore {
  leadId: string
  companyName: string
  domain: string
  status: string
  techStack: string[]
  totalScore: number
  scoreLevel: 'low' | 'medium' | 'high' | 'critical'
  signalCount: number
  recentSignals: number
  trend: 'up' | 'down' | 'stable'
  topSignals: Array<{ type: string; score: number; timestamp: string }>
}

interface LiveSignal {
  id: string
  companyName: string
  domain: string
  leadId: string | null
  signalType: string
  intensity: number
  score: number
  timestamp: string
  status: 'new'
}

interface DashboardStats {
  totalSignals: number
  criticalLeads: number
  highLeads: number
  newSignals24h: number
}

interface DashboardData {
  intentScores: IntentScore[]
  signals: LiveSignal[]
  stats: DashboardStats
}

// ===== 信号类型配置 =====
const SIGNAL_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  page_view:     { label: '页面浏览', icon: Eye,            color: 'text-blue-500' },
  pricing_view:  { label: '查看定价', icon: Target,         color: 'text-orange-500' },
  demo_request:  { label: '申请 Demo', icon: Sparkles,      color: 'text-purple-500' },
  feature_usage: { label: '功能使用', icon: MousePointerClick, color: 'text-green-500' },
  email_open:    { label: '打开邮件', icon: Mail,           color: 'text-teal-500' },
  email_click:   { label: '点击邮件', icon: MousePointerClick, color: 'text-cyan-500' },
  contact_form:  { label: '联系表单', icon: Phone,          color: 'text-rose-500' },
}

// ===== 评分级别配置 =====
const SCORE_LEVEL_CONFIG = {
  critical: { label: '极高意向', color: 'text-red-600',    bg: 'bg-red-500/10',    border: 'border-red-500/20',    icon: Flame },
  high:     { label: '高意向',   color: 'text-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: Zap },
  medium:   { label: '中意向',   color: 'text-yellow-600', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: Star },
  low:      { label: '低意向',   color: 'text-gray-500',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20',   icon: Activity },
}

export default function IntentDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterLevel, setFilterLevel] = useState<string>('all')

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch('/api/intent/dashboard?days=30')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
    } catch {
      toast.error('加载意图数据失败')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // 每 2 分钟自动刷新
    const interval = setInterval(() => fetchData(true), 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  const filteredScores = data?.intentScores.filter(
    (s) => filterLevel === 'all' || s.scoreLevel === filterLevel
  ) ?? []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>加载意图数据...</span>
        </div>
      </div>
    )
  }

  const stats = data?.stats

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">意图雷达</h1>
          <p className="text-muted-foreground text-sm mt-1">
            实时追踪潜在客户的购买意图信号，优先跟进高意向线索
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 统计卡 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="极高意向线索"
          value={stats?.criticalLeads ?? 0}
          icon={Flame}
          color="text-red-500"
          bg="bg-red-500/10"
          desc="需立即跟进"
        />
        <StatCard
          title="高意向线索"
          value={stats?.highLeads ?? 0}
          icon={Zap}
          color="text-orange-500"
          bg="bg-orange-500/10"
          desc="24小时内跟进"
        />
        <StatCard
          title="24h 新信号"
          value={stats?.newSignals24h ?? 0}
          icon={Activity}
          color="text-blue-500"
          bg="bg-blue-500/10"
          desc="最近一天内"
        />
        <StatCard
          title="累计信号总量"
          value={stats?.totalSignals ?? 0}
          icon={Target}
          color="text-purple-500"
          bg="bg-purple-500/10"
          desc="近30天"
        />
      </div>

      {/* 意图排行榜 */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-red-500" />
                意图排行榜
              </CardTitle>
              <CardDescription>按综合意图分排序，结合时间衰减加权</CardDescription>
            </div>
            {/* 筛选按钮 */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'critical', 'high', 'medium', 'low'].map((level) => (
                <Button
                  key={level}
                  variant={filterLevel === level ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterLevel(level)}
                  className="text-xs"
                >
                  {level === 'all' ? '全部' : SCORE_LEVEL_CONFIG[level as keyof typeof SCORE_LEVEL_CONFIG]?.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredScores.length === 0 ? (
            <EmptyState message="暂无符合条件的意图数据" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>公司</TableHead>
                  <TableHead>意向级别</TableHead>
                  <TableHead>意图分</TableHead>
                  <TableHead>信号数</TableHead>
                  <TableHead>7天趋势</TableHead>
                  <TableHead>最新信号</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScores.map((item) => {
                  const levelCfg = SCORE_LEVEL_CONFIG[item.scoreLevel]
                  const LevelIcon = levelCfg.icon
                  return (
                    <TableRow key={item.leadId} className="hover:bg-primary/5 transition-colors">
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.companyName}</div>
                          {item.domain && (
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              {item.domain}
                            </div>
                          )}
                          {item.techStack && item.techStack.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.techStack.slice(0, 3).map((tech) => (
                                <Badge key={tech} variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-blue-50 text-blue-600 border-blue-100 font-normal">
                                  {tech}
                                </Badge>
                              ))}
                              {item.techStack.length > 3 && (
                                <span className="text-[10px] text-muted-foreground">+{item.techStack.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${levelCfg.bg} ${levelCfg.color} ${levelCfg.border} gap-1`}
                        >
                          <LevelIcon className="h-3 w-3" />
                          {levelCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-bold text-primary">{item.totalScore}</div>
                          <Progress
                            value={Math.min(100, (item.totalScore / 300) * 100)}
                            className="h-1.5 w-20"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{item.signalCount}</span>
                          <span className="text-muted-foreground text-xs ml-1">
                            ({item.recentSignals} 近7天)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TrendBadge trend={item.trend} />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {item.topSignals.slice(0, 2).map((sig, i) => {
                            const sigCfg = SIGNAL_TYPE_CONFIG[sig.type]
                            return (
                              <div key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span className={sigCfg?.color ?? ''}>●</span>
                                <span>{sigCfg?.label ?? sig.type}</span>
                                <span className="text-primary font-medium">+{sig.score}</span>
                                <span>· {sig.timestamp}</span>
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
          )}
        </CardContent>
      </Card>

      {/* 实时信号流 */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-500" />
                实时意图信号
              </CardTitle>
              <CardDescription>过去 24 小时内的客户行为信号</CardDescription>
            </div>
            <Badge variant="outline" className="animate-pulse gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              实时更新
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {(data?.signals ?? []).length === 0 ? (
            <EmptyState message="近24小时暂无意图信号" />
          ) : (
            <div className="space-y-3">
              {data!.signals.map((signal) => {
                const sigCfg = SIGNAL_TYPE_CONFIG[signal.signalType]
                const SigIcon = sigCfg?.icon ?? Eye
                return (
                  <div
                    key={signal.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-primary/10 hover:bg-primary/5 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
                        <SigIcon className={`h-4 w-4 ${sigCfg?.color ?? 'text-muted-foreground'}`} />
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-medium text-sm">{signal.companyName}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs py-0">
                            {sigCfg?.label ?? signal.signalType}
                          </Badge>
                          <span>·</span>
                          <span>{signal.timestamp}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-base font-bold text-primary">+{signal.score}</div>
                        <div className="text-xs text-muted-foreground">意图分</div>
                      </div>
                      <div className="w-20">
                        <Progress value={signal.intensity * 100} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ===== 子组件 =====

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
  desc,
}: {
  title: string
  value: number
  icon: any
  color: string
  bg: string
  desc: string
}) {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{desc}</p>
          </div>
          <div className={`p-2.5 rounded-xl ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') {
    return (
      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
        <TrendingUp className="h-3 w-3" /> 上升
      </Badge>
    )
  }
  if (trend === 'down') {
    return (
      <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 gap-1">
        <TrendingDown className="h-3 w-3" /> 下降
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20 gap-1">
      <Minus className="h-3 w-3" /> 稳定
    </Badge>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
      <AlertTriangle className="h-8 w-8 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
