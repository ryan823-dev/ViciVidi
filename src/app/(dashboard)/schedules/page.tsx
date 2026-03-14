'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  Clock,
  Plus,
  MoreVertical,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
  RefreshCw,
  Mail,
  Search
} from 'lucide-react'

interface Schedule {
  id: string
  workspaceId: string
  name: string
  type: string
  cron: string
  config?: any
  enabled: boolean
  lastRunAt?: string
  nextRunAt?: string
  lastRunStatus?: string
  createdAt: string
}

const TASK_TYPES = [
  { value: 'DATA_REFRESH', label: '数据刷新', icon: RefreshCw, description: '定期更新公司数据' },
  { value: 'EMAIL_VERIFICATION', label: '邮箱验证', icon: Mail, description: '批量验证邮箱有效性' },
  { value: 'DUPLICATE_CHECK', label: '去重检测', icon: Search, description: '检测并合并重复公司' }
]

const CRON_PRESETS = [
  { label: '每天凌晨 2 点', value: '0 2 * * *' },
  { label: '每周一凌晨 2 点', value: '0 2 * * 1' },
  { label: '每月 1 号凌晨 2 点', value: '0 2 1 * *' },
  { label: '每 6 小时', value: '0 */6 * * *' },
  { label: '每小时', value: '0 * * * *' }
]

export default function SchedulesPage() {
  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    name: '',
    type: 'DATA_REFRESH',
    cron: '0 2 * * *'
  })

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/schedules?workspaceId=workspace_id')
      const result = await response.json()
      
      if (result.success) {
        setSchedules(result.data)
      } else {
        toast.error('获取定时任务失败')
      }
    } catch (error) {
      console.error('获取定时任务失败:', error)
      toast.error('获取定时任务失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'workspace_id',
          ...newTask
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('定时任务创建成功')
        setCreateDialogOpen(false)
        fetchSchedules()
        setNewTask({ name: '', type: 'DATA_REFRESH', cron: '0 2 * * *' })
      } else {
        toast.error(result.error || '创建失败')
      }
    } catch (error) {
      console.error('创建定时任务失败:', error)
      toast.error('创建失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个定时任务吗？')) return
    
    try {
      const response = await fetch(`/api/schedules?id=${id}&workspaceId=workspace_id`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('定时任务已删除')
        fetchSchedules()
      } else {
        toast.error(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除定时任务失败:', error)
      toast.error('删除失败')
    }
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/schedules/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: id,
          workspaceId: 'workspace_id',
          enabled
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(enabled ? '任务已启用' : '任务已禁用')
        fetchSchedules()
      } else {
        toast.error(result.error || '操作失败')
      }
    } catch (error) {
      console.error('切换任务状态失败:', error)
      toast.error('操作失败')
    }
  }

  const formatCron = (cron: string) => {
    const preset = CRON_PRESETS.find(p => p.value === cron)
    return preset ? preset.label : cron
  }

  const getStatusBadge = (schedule: Schedule) => {
    if (!schedule.enabled) {
      return <Badge variant="secondary">已禁用</Badge>
    }
    
    if (schedule.lastRunStatus === 'success') {
      return <Badge variant="default" className="bg-green-600">成功</Badge>
    } else if (schedule.lastRunStatus === 'failed') {
      return <Badge variant="destructive">失败</Badge>
    }
    
    return <Badge variant="outline">等待执行</Badge>
  }

  const getTaskTypeIcon = (type: string) => {
    const taskType = TASK_TYPES.find(t => t.value === type)
    const Icon = taskType?.icon || Clock
    return <Icon className="h-4 w-4" />
  }

  const getTaskTypeLabel = (type: string) => {
    const taskType = TASK_TYPES.find(t => t.value === type)
    return taskType?.label || type
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('zh-CN')
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
          <h1 className="text-3xl font-bold">定时刷新</h1>
          <p className="text-muted-foreground mt-1">设置自动执行的数据刷新和验证任务</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              创建任务
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>创建定时任务</DialogTitle>
                <DialogDescription>
                  设置自动执行的数据维护任务
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">任务名称</Label>
                  <Input
                    id="name"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    placeholder="例如：每周数据刷新"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">任务类型</Label>
                  <Select
                    value={newTask.type}
                    onValueChange={(value) => value && setNewTask({ ...newTask, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            {getTaskTypeIcon(type.value)}
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {TASK_TYPES.find(t => t.value === newTask.type)?.description}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cron">执行频率</Label>
                  <Select
                    value={newTask.cron}
                    onValueChange={(value) => value && setNewTask({ ...newTask, cron: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CRON_PRESETS.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Cron 表达式：{newTask.cron}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">
                  创建任务
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 任务列表 */}
      <div className="grid gap-4 md:grid-cols-2">
        {schedules.length > 0 ? (
          schedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getTaskTypeIcon(schedule.type)}
                    <CardTitle className="text-lg">{schedule.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDelete(schedule.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription className="flex items-center gap-2">
                  {getTaskTypeLabel(schedule.type)} · {formatCron(schedule.cron)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">下次执行:</span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatDateTime(schedule.nextRunAt)}
                    </span>
                  </div>
                  
                  {schedule.lastRunAt && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {schedule.lastRunStatus === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : schedule.lastRunStatus === 'failed' ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Play className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground">上次执行:</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatDateTime(schedule.lastRunAt)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(schedule)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">启用</span>
                      <Switch
                        checked={schedule.enabled}
                        onCheckedChange={(checked) => handleToggle(schedule.id, checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">暂无定时任务</h3>
                <p className="text-muted-foreground mb-4">
                  创建第一个定时任务，让数据保持最新
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  创建任务
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 说明信息 */}
      <Card>
        <CardHeader>
          <CardTitle>关于定时任务</CardTitle>
          <CardDescription>
            定时任务可以帮助您自动执行数据维护工作
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {TASK_TYPES.map((type) => (
              <div key={type.value} className="space-y-2">
                <div className="flex items-center gap-2">
                  <type.icon className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">{type.label}</h4>
                </div>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
