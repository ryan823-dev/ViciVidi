'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Key, 
  ExternalLink, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Trash2,
  Loader2,
  RefreshCw
} from 'lucide-react'

interface ApiService {
  id: string
  name: string
  description: string
  requiresSecret: boolean
  freeQuota: string
  signUpUrl: string
  icon: string
  isConfigured: boolean
  isEnabled: boolean
  lastUsedAt: string | null
  notes: string | null
  hasKey: boolean
  hasSecret: boolean
}

export default function ApiKeysPage() {
  const [services, setServices] = useState<ApiService[]>([])
  const [loading, setLoading] = useState(true)
  const [workspaceId, setWorkspaceId] = useState<string>('')
  const [editingService, setEditingService] = useState<ApiService | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showKey, setShowKey] = useState(false)

  // 表单数据
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [isEnabled, setIsEnabled] = useState(true)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/settings/api-keys')
      const data = await res.json()
      if (data.success) {
        setServices(data.data)
        setWorkspaceId(data.workspaceId)
      }
    } catch (error) {
      toast.error('获取API配置失败')
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (service: ApiService) => {
    setEditingService(service)
    setApiKey('')
    setApiSecret('')
    setIsEnabled(service.isEnabled)
    setNotes(service.notes || '')
    setShowKey(false)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!editingService) return

    if (!apiKey.trim() && !editingService.hasKey) {
      toast.error('请输入API密钥')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          service: editingService.id,
          apiKey: apiKey || undefined,
          apiSecret: apiSecret || undefined,
          isEnabled,
          notes,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success('保存成功')
        setDialogOpen(false)
        fetchServices()
      } else {
        toast.error(data.error || '保存失败')
      }
    } catch (error) {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (serviceId: string) => {
    if (!confirm('确定要删除此API密钥吗？')) return

    try {
      const res = await fetch(`/api/settings/api-keys?workspaceId=${workspaceId}&service=${serviceId}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (data.success) {
        toast.success('删除成功')
        fetchServices()
      }
    } catch (error) {
      toast.error('删除失败')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API 密钥管理</h1>
          <p className="text-muted-foreground mt-1">
            配置第三方服务的API密钥，用于数据丰富功能
          </p>
        </div>
        <Button variant="outline" onClick={fetchServices}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 已配置服务概览 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">配置概览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">已配置：</span>
              <span className="font-semibold text-green-600 ml-1">
                {services.filter(s => s.hasKey).length}
              </span>
              <span className="text-muted-foreground"> / {services.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">已启用：</span>
              <span className="font-semibold ml-1">
                {services.filter(s => s.hasKey && s.isEnabled).length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 服务列表 */}
      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service.id} className={service.hasKey ? '' : 'opacity-80'}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{service.icon}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                      {service.hasKey ? (
                        <Badge variant="default" className="bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          已配置
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <X className="h-3 w-3 mr-1" />
                          未配置
                        </Badge>
                      )}
                      {!service.isEnabled && service.hasKey && (
                        <Badge variant="outline" className="text-yellow-600">
                          已禁用
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>免费额度：{service.freeQuota}</span>
                      {service.lastUsedAt && (
                        <span>
                          最后使用：{new Date(service.lastUsedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(service.signUpUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    注册
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => openEditDialog(service)}
                  >
                    <Key className="h-4 w-4 mr-1" />
                    {service.hasKey ? '编辑' : '配置'}
                  </Button>
                  {service.hasKey && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingService?.icon} {editingService?.name}
            </DialogTitle>
            <DialogDescription>
              输入您的API密钥。密钥将加密存储，仅在服务器端使用。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showKey ? 'text' : 'password'}
                  placeholder="输入API密钥"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {editingService?.hasKey && !apiKey && (
                <p className="text-xs text-muted-foreground">
                  留空保持现有密钥不变
                </p>
              )}
            </div>

            {editingService?.requiresSecret && (
              <div className="space-y-2">
                <Label htmlFor="apiSecret">API Secret</Label>
                <Input
                  id="apiSecret"
                  type={showKey ? 'text' : 'password'}
                  placeholder="输入API密钥"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">启用此服务</Label>
              <Switch
                id="enabled"
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">备注（可选）</Label>
              <Input
                id="notes"
                placeholder="例如：测试账号"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">使用说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. 点击「注册」按钮前往服务商官网注册账号</p>
          <p>2. 获取API密钥后，点击「配置」按钮填入密钥</p>
          <p>3. 配置完成后，系统将优先使用您配置的密钥</p>
          <p>4. 所有密钥均加密存储，安全可靠</p>
        </CardContent>
      </Card>
    </div>
  )
}