'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { LeadDiscoveryDialog } from '@/components/leads/lead-discovery-dialog'
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  ExternalLink, 
  Mail, 
  Phone, 
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MapPin,
  TrendingUp,
  Filter,
  Sparkles,
  Zap,
  Target,
  Star,
  Compass
} from 'lucide-react'
import { toast } from 'sonner'

interface Lead {
  id: string
  companyName: string
  domain: string | null
  contactName: string | null
  email: string | null
  phone: string | null
  website: string | null
  country: string | null
  city: string | null
  industry: string | null
  companySize: string | null
  status: string
  tier: string | null
  matchScore: number | null
  sourceId: string | null
  sourceUrl: string | null
  priority: string
  tags: string[]
  createdAt: string
  qualifiedAt: string | null
}

const STATUS_CONFIG = {
  NEW: { label: '新发现', color: 'bg-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Clock },
  REVIEWING: { label: '审核中', color: 'bg-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: User },
  QUALIFIED: { label: '已合格', color: 'bg-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle2 },
  IMPORTED: { label: '已导入', color: 'bg-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: Building2 },
  EXCLUDED: { label: '已排除', color: 'bg-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: XCircle },
  ENRICHING: { label: '丰富中', color: 'bg-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: TrendingUp },
  CONTACTED: { label: '已联系', color: 'bg-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/20', icon: Phone },
  CONVERTED: { label: '已转化', color: 'bg-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2 },
}

const TIER_CONFIG = {
  A: { label: 'A 级', color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Star },
  B: { label: 'B 级', color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Target },
  C: { label: 'C 级', color: 'text-gray-600', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: Zap },
  EXCLUDED: { label: '排除', color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle },
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [tierFilter, setStatusTier] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [discoveryOpen, setDiscoveryOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  const loadLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (tierFilter) params.set('tier', tierFilter)
      
      const response = await fetch(`/api/leads?${params}`)
      if (!response.ok) throw new Error('Failed to load leads')
      const data = await response.json()
      setLeads(data.leads || [])
    } catch (error) {
      console.error('Error loading leads:', error)
      toast.error('加载线索失败')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, tierFilter])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (!response.ok) throw new Error('Failed to update status')
      
      toast.success('状态已更新')
      loadLeads()
    } catch (error) {
      toast.error('更新状态失败')
    }
  }

  const handleUpdateTier = async (leadId: string, newTier: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier }),
      })
      
      if (!response.ok) throw new Error('Failed to update tier')
      
      toast.success('分层已更新')
      loadLeads()
    } catch (error) {
      toast.error('更新分层失败')
    }
  }

  const filteredLeads = leads.filter(
    (lead) =>
      lead.companyName.toLowerCase().includes(search.toLowerCase()) ||
      lead.domain?.toLowerCase().includes(search.toLowerCase()) ||
      lead.contactName?.toLowerCase().includes(search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(search.toLowerCase())
  )

  // 统计
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'NEW').length,
    qualified: leads.filter(l => l.status === 'QUALIFIED').length,
    tierA: leads.filter(l => l.tier === 'A').length,
  }

  return (
    <div className="space-y-8">
      {/* 发现线索区域 */}
      <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent">
        <CardContent className="p-8">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div className="space-y-3 flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <Compass className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary">智能获客</span>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary via-[oklch(0.55_0.30_320)] to-[oklch(0.65_0.28_25)] bg-clip-text text-transparent">
                🔍 发现线索
              </h2>
              <p className="text-muted-foreground max-w-2xl">
                从 LinkedIn、GitHub、Product Hunt、AngelList 快速找到潜在客户，AI 自动评分和丰富数据
              </p>
              
              <div className="flex gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>LinkedIn 公司库</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  <span>GitHub 技术组织</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ExternalLink className="h-4 w-4" />
                  <span>Product Hunt 新品</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>AngelList 初创企业</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={() => setDiscoveryOpen(true)}
              className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 flex-shrink-0 h-14 px-8 text-lg"
              size="lg"
            >
              <Compass className="h-5 w-5 mr-2" />
              立即发现线索
            </Button>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground bg-background/50 rounded-lg p-3">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span>预计耗时：5-10 秒</span>
            <span className="mx-2">•</span>
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span>自动去重检测</span>
            <span className="mx-2">•</span>
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span>AI 智能评分</span>
            <span className="mx-2">•</span>
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span>批量导入</span>
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 - 玻璃态设计 */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="relative overflow-hidden border-0 shadow-lg shadow-primary/5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">总线索数</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">{stats.total}</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                <Building2 className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-0 shadow-lg shadow-success/5 transition-all duration-300 hover:shadow-xl hover:shadow-success/10 hover:-translate-y-1 group">
          <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">新发现</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-success to-success/80 bg-clip-text text-transparent">{stats.new}</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-0 shadow-lg shadow-info/5 transition-all duration-300 hover:shadow-xl hover:shadow-info/10 hover:-translate-y-1 group">
          <div className="absolute inset-0 bg-gradient-to-br from-info/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">已合格</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-info to-info/80 bg-clip-text text-transparent">{stats.qualified}</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-0 shadow-lg shadow-warning/5 transition-all duration-300 hover:shadow-xl hover:shadow-warning/10 hover:-translate-y-1 group">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardContent className="pt-6 relative">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">A 级线索</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-warning to-warning/80 bg-clip-text text-transparent">{stats.tierA}</p>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
                <User className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 过滤器 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索公司名、域名、联系人、邮箱..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card/50 backdrop-blur-sm border-primary/10 focus:border-primary/30 transition-all duration-300"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" className="border-primary/10 hover:border-primary/30 transition-all duration-300">
              <Filter className="h-4 w-4 mr-2" />
              状态
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter('')}>
              全部状态
            </DropdownMenuItem>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => setStatusFilter(key)}
              >
                <span className={`w-2 h-2 rounded-full ${config.color} mr-2`} />
                {config.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" className="border-primary/10 hover:border-primary/30 transition-all duration-300">
              <Filter className="h-4 w-4 mr-2" />
              分层
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusTier('')}>
              全部分层
            </DropdownMenuItem>
            {Object.entries(TIER_CONFIG).map(([key, config]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => setStatusTier(key)}
              >
                <Badge variant="outline" className={`${config.bg} ${config.border}`}>
                  <span className={config.color}>{config.label}</span>
                </Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 线索列表 - 现代化表格 */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-muted-foreground">加载中...</p>
              </div>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Building2 className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">暂无线索</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-primary/10">
                  <TableHead className="font-semibold">公司</TableHead>
                  <TableHead className="font-semibold">联系人</TableHead>
                  <TableHead className="font-semibold">匹配度</TableHead>
                  <TableHead className="font-semibold">状态</TableHead>
                  <TableHead className="font-semibold">分层</TableHead>
                  <TableHead className="font-semibold">来源</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="transition-all duration-200 hover:bg-primary/5">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-semibold text-primary">{lead.companyName}</div>
                        {lead.domain && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            {lead.domain}
                          </div>
                        )}
                        {lead.industry && (
                          <div className="text-xs text-muted-foreground">
                            {lead.industry}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {lead.contactName && (
                          <div className="text-sm font-medium">{lead.contactName}</div>
                        )}
                        {lead.email && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </div>
                        )}
                        {lead.phone && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.matchScore ? (
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                lead.matchScore >= 80 ? 'bg-gradient-to-r from-success to-success/80' :
                                lead.matchScore >= 60 ? 'bg-gradient-to-r from-warning to-warning/80' :
                                'bg-gradient-to-r from-destructive to-destructive/80'
                              }`}
                              style={{ width: `${lead.matchScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-primary">
                            {Math.round(lead.matchScore)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${STATUS_CONFIG[lead.status as keyof typeof STATUS_CONFIG]?.bg} ${STATUS_CONFIG[lead.status as keyof typeof STATUS_CONFIG]?.border} border`}
                      >
                        <span className={`w-2 h-2 rounded-full mr-2 ${STATUS_CONFIG[lead.status as keyof typeof STATUS_CONFIG]?.color}`} />
                        {STATUS_CONFIG[lead.status as keyof typeof STATUS_CONFIG]?.label || lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lead.tier ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-6 px-2 ${TIER_CONFIG[lead.tier as keyof typeof TIER_CONFIG]?.bg} ${TIER_CONFIG[lead.tier as keyof typeof TIER_CONFIG]?.border} border`}
                            >
                              <span className={`flex items-center gap-1 ${TIER_CONFIG[lead.tier as keyof typeof TIER_CONFIG]?.color}`}>
                                {lead.tier === 'A' && <Star className="h-3 w-3" />}
                                {lead.tier === 'B' && <Target className="h-3 w-3" />}
                                {lead.tier === 'C' && <Zap className="h-3 w-3" />}
                                {TIER_CONFIG[lead.tier as keyof typeof TIER_CONFIG]?.label}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleUpdateTier(lead.id, 'A')}>
                              <span className="flex items-center gap-2 text-emerald-600">
                                <Star className="h-3 w-3" /> A 级
                              </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateTier(lead.id, 'B')}>
                              <span className="flex items-center gap-2 text-blue-600">
                                <Target className="h-3 w-3" /> B 级
                              </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateTier(lead.id, 'C')}>
                              <span className="flex items-center gap-2 text-gray-600">
                                <Zap className="h-3 w-3" /> C 级
                              </span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-muted-foreground">未分层</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {lead.sourceId && (
                          <div className="text-xs font-medium">{lead.sourceId}</div>
                        )}
                        {lead.sourceUrl ? (
                          <a
                            href={lead.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 transition-all duration-200"
                          >
                            查看来源
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="sm" className="hover:bg-primary/10 transition-all duration-200">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(lead.id, 'REVIEWING')}
                            className="hover:bg-primary/10 transition-all duration-200"
                          >
                            标记为审核
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(lead.id, 'QUALIFIED')}
                            className="hover:bg-success/10 transition-all duration-200"
                          >
                            标记为合格
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(lead.id, 'EXCLUDED')}
                            className="hover:bg-destructive/10 transition-all duration-200"
                          >
                            排除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 新建线索对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              新建线索
            </DialogTitle>
            <DialogDescription>
              手动添加一个新的销售线索
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const data = Object.fromEntries(formData)
              
              try {
                const response = await fetch('/api/leads', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                })
                
                if (!response.ok) throw new Error('Failed to create lead')
                
                toast.success('线索创建成功')
                setDialogOpen(false)
                loadLeads()
              } catch (error) {
                toast.error('创建线索失败')
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">公司名称 *</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  required
                  placeholder="输入公司名称"
                  className="transition-all duration-300 focus:border-primary/50"
                />
              </div>
              <div>
                <Label htmlFor="domain">域名</Label>
                <Input
                  id="domain"
                  name="domain"
                  placeholder="example.com"
                  className="transition-all duration-300 focus:border-primary/50"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactName">联系人</Label>
                <Input
                  id="contactName"
                  name="contactName"
                  placeholder="输入联系人姓名"
                  className="transition-all duration-300 focus:border-primary/50"
                />
              </div>
              <div>
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
                  className="transition-all duration-300 focus:border-primary/50"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">电话</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="输入电话号码"
                  className="transition-all duration-300 focus:border-primary/50"
                />
              </div>
              <div>
                <Label htmlFor="website">网站</Label>
                <Input
                  id="website"
                  name="website"
                  placeholder="https://example.com"
                  className="transition-all duration-300 focus:border-primary/50"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">国家</Label>
                <Input
                  id="country"
                  name="country"
                  placeholder="中国"
                  className="transition-all duration-300 focus:border-primary/50"
                />
              </div>
              <div>
                <Label htmlFor="city">城市</Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="上海"
                  className="transition-all duration-300 focus:border-primary/50"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="industry">行业</Label>
              <Input
                id="industry"
                name="industry"
                placeholder="输入行业"
                className="transition-all duration-300 focus:border-primary/50"
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90">
                创建线索
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 线索发现对话框 */}
      <LeadDiscoveryDialog open={discoveryOpen} onOpenChange={setDiscoveryOpen} />
    </div>
  )
}
