'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Copy,
  Merge,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Trash2
} from 'lucide-react'

interface DuplicateGroup {
  id: string
  groupId: string
  companies: Array<{
    id: string
    domain: string
    name: string
    phone?: string
    email?: string
    website?: string
    addedAt: string
  }>
  similarity: number
  matchReasons: string[]
}

export default function DuplicatesPage() {
  const [loading, setLoading] = useState(true)
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([])
  const [threshold, setThreshold] = useState('0.85')
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null)
  const [keepCompanyId, setKeepCompanyId] = useState('')
  const [merging, setMerging] = useState(false)

  useEffect(() => {
    detectDuplicates()
  }, [threshold])

  const detectDuplicates = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/duplicates?workspaceId=workspace_id&threshold=${threshold}`)
      const result = await response.json()
      
      if (result.success) {
        setDuplicates(result.data.duplicates)
      } else {
        toast.error('检测失败')
      }
    } catch (error) {
      console.error('检测重复公司失败:', error)
      toast.error('检测失败')
    } finally {
      setLoading(false)
    }
  }

  const handleMerge = async () => {
    if (!selectedGroup || !keepCompanyId) return
    
    const mergeCompanyId = selectedGroup.companies.find(c => c.id !== keepCompanyId)?.id
    if (!mergeCompanyId) return
    
    try {
      setMerging(true)
      const response = await fetch('/api/duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'workspace_id',
          duplicateGroupId: selectedGroup.groupId,
          keepCompanyId,
          mergeCompanyId
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('公司合并成功')
        setMergeDialogOpen(false)
        detectDuplicates()
      } else {
        toast.error(result.error || '合并失败')
      }
    } catch (error) {
      console.error('合并公司失败:', error)
      toast.error('合并失败')
    } finally {
      setMerging(false)
    }
  }

  const openMergeDialog = (group: DuplicateGroup) => {
    setSelectedGroup(group)
    setKeepCompanyId(group.companies[0].id) // 默认保留第一个
    setMergeDialogOpen(true)
  }

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.95) return 'text-green-600'
    if (similarity >= 0.9) return 'text-blue-600'
    return 'text-yellow-600'
  }

  const getSimilarityBadge = (similarity: number) => {
    if (similarity >= 0.95) return <Badge className="bg-green-600">极高</Badge>
    if (similarity >= 0.9) return <Badge className="bg-blue-600">很高</Badge>
    return <Badge variant="default">较高</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">去重检测</h1>
          <p className="text-muted-foreground mt-1">智能识别并合并重复的公司记录</p>
        </div>
        <div className="flex gap-2">
          <Select value={threshold} onValueChange={(value) => value && setThreshold(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.95">极高相似度 (95%)</SelectItem>
              <SelectItem value="0.90">很高相似度 (90%)</SelectItem>
              <SelectItem value="0.85">较高相似度 (85%)</SelectItem>
              <SelectItem value="0.80">中等相似度 (80%)</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={detectDuplicates}>
            <RefreshCw className="h-4 w-4 mr-2" />
            重新检测
          </Button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">重复组数</CardTitle>
            <Copy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{duplicates.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              涉及 {duplicates.length * 2} 家公司
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均相似度</CardTitle>
            <Merge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {duplicates.length > 0 
                ? ((duplicates.reduce((sum, d) => sum + d.similarity, 0) / duplicates.length) * 100).toFixed(1)
                : '0'
              }%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              可信任的匹配
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">预计可合并</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{duplicates.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              个重复记录
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 重复列表 */}
      {duplicates.length > 0 ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                发现的重复公司
              </CardTitle>
              <CardDescription>
                点击"合并"按钮将重复的公司记录合并为一条
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {duplicates.map((group) => (
                  <div key={group.id} className="border rounded-lg p-4 space-y-3">
                    {/* 相似度信息 */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {getSimilarityBadge(group.similarity)}
                        <span className={`font-medium ${getSimilarityColor(group.similarity)}`}>
                          相似度：{(group.similarity * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openMergeDialog(group)}
                      >
                        <Merge className="h-4 w-4 mr-2" />
                        合并
                      </Button>
                    </div>

                    {/* 匹配原因 */}
                    <div className="flex flex-wrap gap-2">
                      {group.matchReasons.map((reason, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {reason}
                        </Badge>
                      ))}
                    </div>

                    {/* 公司信息对比 */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {group.companies.map((company) => (
                        <div
                          key={company.id}
                          className={`p-3 rounded-md border ${
                            keepCompanyId === company.id ? 'bg-primary/5 border-primary' : 'bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="radio"
                              name={`keep_${group.id}`}
                              checked={keepCompanyId === company.id}
                              onChange={() => setKeepCompanyId(company.id)}
                              className="h-4 w-4"
                            />
                            <span className="text-sm font-medium">保留此公司</span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">名称:</span>
                              <span className="font-medium">{company.name || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">域名:</span>
                              <span className="font-medium">{company.domain || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">电话:</span>
                              <span className="font-medium">{company.phone || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">网站:</span>
                              <span className="font-medium truncate max-w-[200px]">{company.website || '-'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 合并说明 */}
                    <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      <Shield className="h-4 w-4 mt-0.5" />
                      <span>
                        合并后将保留所选公司的所有数据，另一个公司的记录将被删除。
                        此操作不可撤销。
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">未发现重复公司</h3>
            <p className="text-muted-foreground mb-4">
              您的公司数据很干净，没有检测到重复记录
            </p>
            <Button variant="outline" onClick={detectDuplicates}>
              <RefreshCw className="h-4 w-4 mr-2" />
              再次检测
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 说明信息 */}
      <Card>
        <CardHeader>
          <CardTitle>去重检测说明</CardTitle>
          <CardDescription>
            系统会基于多个维度智能识别重复的公司记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Copy className="h-4 w-4 text-primary" />
                域名匹配
              </h4>
              <p className="text-sm text-muted-foreground">
                检测相同或相似的域名（包括 www 前缀、末尾斜杠等变体）
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Merge className="h-4 w-4 text-primary" />
                名称相似度
              </h4>
              <p className="text-sm text-muted-foreground">
                使用字符串相似度算法识别公司名称的变体和缩写
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                联系信息
              </h4>
              <p className="text-sm text-muted-foreground">
                比对电话号码、邮箱域名、网站等多个联系信息
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 合并确认对话框 */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认合并公司</DialogTitle>
            <DialogDescription>
              请再次确认要合并的公司记录
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 p-3 border rounded-lg bg-primary/5">
                <p className="text-sm font-medium mb-1">保留的公司</p>
                <p className="text-sm">
                  {selectedGroup?.companies.find(c => c.id === keepCompanyId)?.name}
                </p>
              </div>
              <Merge className="h-6 w-6 text-primary" />
              <div className="flex-1 p-3 border rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-1">将被删除的公司</p>
                <p className="text-sm">
                  {selectedGroup?.companies.find(c => c.id !== keepCompanyId)?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-3 rounded">
              <AlertTriangle className="h-4 w-4" />
              <span>此操作不可撤销，请谨慎操作</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleMerge} disabled={merging}>
              {merging && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              {merging ? '合并中...' : '确认合并'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
