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
  Filter
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
  NEW: { label: '新发现', color: 'bg-blue-500', bg: 'bg-blue-50', icon: Clock },
  REVIEWING: { label: '审核中', color: 'bg-yellow-500', bg: 'bg-yellow-50', icon: User },
  QUALIFIED: { label: '已合格', color: 'bg-green-500', bg: 'bg-green-50', icon: CheckCircle2 },
  IMPORTED: { label: '已导入', color: 'bg-purple-500', bg: 'bg-purple-50', icon: Building2 },
  EXCLUDED: { label: '已排除', color: 'bg-gray-500', bg: 'bg-gray-50', icon: XCircle },
  ENRICHING: { label: '丰富中', color: 'bg-indigo-500', bg: 'bg-indigo-50', icon: TrendingUp },
  CONTACTED: { label: '已联系', color: 'bg-teal-500', bg: 'bg-teal-50', icon: Phone },
  CONVERTED: { label: '已转化', color: 'bg-emerald-500', bg: 'bg-emerald-50', icon: CheckCircle2 },
}

const TIER_CONFIG = {
  A: { label: 'A 级', color: 'text-green-600', bg: 'bg-green-50' },
  B: { label: 'B 级', color: 'text-blue-600', bg: 'bg-blue-50' },
  C: { label: 'C 级', color: 'text-gray-600', bg: 'bg-gray-50' },
  EXCLUDED: { label: '排除', color: 'text-red-600', bg: 'bg-red-50' },
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [tierFilter, setStatusTier] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
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
    <div className="space-y-6">
      {/* 头部统计 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">获客线索</h1>
          <p className="text-muted-foreground mt-1">
            AI 驱动的智能线索发现与管理
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新建线索
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总线索数</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">新发现</p>
                <p className="text-2xl font-bold">{stats.new}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已合格</p>
                <p className="text-2xl font-bold">{stats.qualified}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <User className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">A 级线索</p>
                <p className="text-2xl font-bold">{stats.tierA}</p>
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
            className="pl-10"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline">
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
            <Button variant="outline">
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
                <Badge variant="outline" className={config.bg}>
                  <span className={config.color}>{config.label}</span>
                </Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 线索列表 */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">加载中...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">暂无线索</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>公司</TableHead>
                  <TableHead>联系人</TableHead>
                  <TableHead>匹配度</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>分层</TableHead>
                  <TableHead>来源</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{lead.companyName}</div>
                        {lead.domain && (
                          <div className="text-sm text-muted-foreground">
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
                          <div className="text-sm">{lead.contactName}</div>
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
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                lead.matchScore >= 80 ? 'bg-green-500' :
                                lead.matchScore >= 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${lead.matchScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
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
                        className={`${
                          STATUS_CONFIG[lead.status as keyof typeof STATUS_CONFIG]?.bg || 'bg-gray-50'
                        } border-0`}
                      >
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                          STATUS_CONFIG[lead.status as keyof typeof STATUS_CONFIG]?.color || 'bg-gray-500'
                        }`} />
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
                              className={`h-6 px-2 ${
                                TIER_CONFIG[lead.tier as keyof typeof TIER_CONFIG]?.bg
                              }`}
                            >
                              <span className={
                                TIER_CONFIG[lead.tier as keyof typeof TIER_CONFIG]?.color
                              }>
                                {TIER_CONFIG[lead.tier as keyof typeof TIER_CONFIG]?.label}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleUpdateTier(lead.id, 'A')}>
                              <span className="text-green-600">A 级</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateTier(lead.id, 'B')}>
                              <span className="text-blue-600">B 级</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateTier(lead.id, 'C')}>
                              <span className="text-gray-600">C 级</span>
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
                          <div className="text-xs">
                            {lead.sourceId}
                          </div>
                        )}
                        {lead.sourceUrl ? (
                          <a
                            href={lead.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
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
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(lead.id, 'REVIEWING')}
                          >
                            标记为审核
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(lead.id, 'QUALIFIED')}
                          >
                            标记为合格
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(lead.id, 'EXCLUDED')}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建线索</DialogTitle>
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
                />
              </div>
              <div>
                <Label htmlFor="domain">域名</Label>
                <Input
                  id="domain"
                  name="domain"
                  placeholder="example.com"
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
                />
              </div>
              <div>
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@example.com"
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
                />
              </div>
              <div>
                <Label htmlFor="website">网站</Label>
                <Input
                  id="website"
                  name="website"
                  placeholder="https://example.com"
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
                />
              </div>
              <div>
                <Label htmlFor="city">城市</Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="上海"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="industry">行业</Label>
              <Input
                id="industry"
                name="industry"
                placeholder="输入行业"
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">创建线索</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
