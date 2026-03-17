'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Linkedin, 
  Github, 
  ExternalLink, 
  Sparkles,
  MapPin,
  Building2,
  Users,
  CheckCircle2,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface DiscoveredLead {
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
  description: string | null
  sourceUrl: string | null
  sourceId: string
}

interface LeadDiscoveryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SOURCE_CONFIG = {
  linkedin: { 
    label: 'LinkedIn', 
    icon: Linkedin,
    description: '全球职场人脉，适合找公司和决策人',
    color: 'bg-blue-600'
  },
  github: { 
    label: 'GitHub', 
    icon: Github,
    description: '开发者社区，适合找技术团队',
    color: 'bg-gray-800'
  },
  producthunt: { 
    label: 'Product Hunt', 
    icon: ExternalLink,
    description: '新产品发布平台，适合找初创公司',
    color: 'bg-orange-500'
  },
  angellist: { 
    label: 'AngelList', 
    icon: Building2,
    description: '初创企业数据库，适合找融资公司',
    color: 'bg-purple-600'
  },
} as const

type DataSource = keyof typeof SOURCE_CONFIG

export function LeadDiscoveryDialog({ open, onOpenChange }: LeadDiscoveryDialogProps) {
  const t = useTranslations('leads.discover')
  const [selectedSource, setSelectedSource] = useState<DataSource>('linkedin')
  const [keywords, setKeywords] = useState('')
  const [location, setLocation] = useState('')
  const [industry, setIndustry] = useState('')
  const [technologies, setTechnologies] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<DiscoveredLead[]>([])
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])

  const handleSearch = async () => {
    if (!keywords.trim()) {
      toast.error('请输入关键词')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/prospects/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: selectedSource,
          keywords,
          location: location || undefined,
          industry: industry || undefined,
          technologies: technologies ? technologies.split(',').map(t => t.trim()) : undefined,
          limit: 20,
        }),
      })

      if (!response.ok) throw new Error('搜索失败')

      const data = await response.json()
      setResults(data.leads || [])
      setSelectedLeads([])
      
      if (data.leads?.length === 0) {
        toast.info('未找到匹配的线索')
      } else {
        toast.success(`找到 ${data.leads.length} 条线索`)
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('搜索失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    const leadsToImport = results.filter((_, index) => selectedLeads.includes(index.toString()))
    
    if (leadsToImport.length === 0) {
      toast.error('请选择要导入的线索')
      return
    }

    setLoading(true)
    try {
      let importedCount = 0
      
      for (const lead of leadsToImport) {
        try {
          await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...lead,
              status: 'NEW',
              priority: 'medium',
            }),
          })
          importedCount++
        } catch (error) {
          console.error('Failed to import lead:', error)
        }
      }

      toast.success(`成功导入 ${importedCount} 条线索`)
      onOpenChange(false)
      
      // 刷新页面
      window.location.reload()
    } catch (error) {
      console.error('Import error:', error)
      toast.error('导入失败')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedLeads.length === results.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(results.map((_, i) => i.toString()))
    }
  }

  const toggleSelect = (index: string) => {
    setSelectedLeads(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* 数据源选择 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.entries(SOURCE_CONFIG) as [DataSource, typeof SOURCE_CONFIG[keyof typeof SOURCE_CONFIG]][]).map(([key, config]) => {
              const Icon = config.icon
              return (
                <Card
                  key={key}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedSource === key 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => setSelectedSource(key)}
                >
                  <CardContent className="p-4 text-center space-y-2">
                    <div className={`w-12 h-12 mx-auto rounded-xl ${config.color} flex items-center justify-center`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="font-semibold text-sm">{config.label}</div>
                    <div className="text-xs text-muted-foreground">{config.description}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* 搜索条件 */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="keywords">{t('form.keywords')} *</Label>
                <Input
                  id="keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="例如：SaaS, AI, CRM, 营销自动化"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="location">
                  <MapPin className="inline h-3 w-3 mr-1" />
                  {t('form.location')}
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="例如：美国，加州，硅谷"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry">
                  <Building2 className="inline h-3 w-3 mr-1" />
                  {t('form.industry')}
                </Label>
                <Input
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="例如：SaaS, 电商，金融科技"
                  className="mt-1"
                />
              </div>
              
              {selectedSource === 'github' && (
                <div>
                  <Label htmlFor="technologies">
                    <Users className="inline h-3 w-3 mr-1" />
                    {t('form.technologies')}
                  </Label>
                  <Input
                    id="technologies"
                    value={technologies}
                    onChange={(e) => setTechnologies(e.target.value)}
                    placeholder="例如：React, Python, TypeScript"
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 搜索按钮 */}
          <Button
            onClick={handleSearch}
            disabled={loading || !keywords.trim()}
            className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                搜索中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {t('form.search')}
              </>
            )}
          </Button>

          {/* 搜索结果 */}
          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedLeads.length === results.length}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm font-medium">
                    已选择 {selectedLeads.length} / {results.length}
                  </span>
                </div>
                <Badge variant="secondary">
                  {t('form.estimated').replace('{count}', results.length.toString())}
                </Badge>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.map((lead, index) => (
                  <Card
                    key={index}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedLeads.includes(index.toString())
                        ? 'ring-2 ring-primary bg-primary/5'
                        : ''
                    }`}
                    onClick={() => toggleSelect(index.toString())}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedLeads.includes(index.toString())}
                          onCheckedChange={() => toggleSelect(index.toString())}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-primary">{lead.companyName}</div>
                            {lead.sourceUrl && (
                              <a
                                href={lead.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                查看来源
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {lead.domain && (
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {lead.domain}
                              </div>
                            )}
                            {lead.industry && <div>{lead.industry}</div>}
                            {lead.country && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {lead.country}
                              </div>
                            )}
                            {lead.contactName && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {lead.contactName}
                              </div>
                            )}
                          </div>
                          
                          {lead.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                              {lead.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* 空状态 */}
          {results.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>输入搜索条件，点击"开始搜索"查找潜在客户</p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleImport}
            disabled={loading || selectedLeads.length === 0}
            className="bg-gradient-to-r from-success to-success/80"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {t('results.importSelected').replace('{count}', selectedLeads.length.toString())}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
