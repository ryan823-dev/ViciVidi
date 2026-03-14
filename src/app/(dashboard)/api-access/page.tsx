'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Key, Plus, Copy, Check, Trash2, Shield, Book, Code } from 'lucide-react'
import { toast } from 'sonner'

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  key?: string // 仅在创建时返回
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string | null
}

export default function ApiAccessPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState<ApiKey | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/api-keys')
      if (!response.ok) throw new Error('Failed to fetch keys')
      const data = await response.json()
      setKeys(data.keys || [])
    } catch (error) {
      console.error('Error fetching keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '创建失败')
      }

      const data = await response.json()
      
      if (data.mock) {
        toast.success(data.message)
        setNewKey(data.key)
      } else {
        toast.success('API 密钥已创建')
        setNewKey(data.key)
      }

      setKeyName('')
      setCreateDialogOpen(false)
      fetchKeys()
    } catch (error) {
      console.error('Create key error:', error)
      toast.error(error instanceof Error ? error.message : '创建失败')
    } finally {
      setCreating(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('已复制到剪贴板')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRevoke = async (keyId: string) => {
    if (!confirm('确定要撤销此 API 密钥吗？撤销后将无法使用。')) return

    try {
      const response = await fetch(`/api/api-keys?id=${keyId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('撤销失败')

      toast.success('API 密钥已撤销')
      fetchKeys()
    } catch (error) {
      toast.error('撤销失败')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Key className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">加载 API 密钥...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">API 访问</h1>
        <p className="text-muted-foreground mt-1">
          管理 API 密钥，访问 ViciVidi AI 服务
        </p>
      </div>

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            API 状态
          </CardTitle>
          <CardDescription>
            当前 API 服务运行正常
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">API 密钥</p>
              <p className="text-2xl font-bold">{keys.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">活跃密钥</p>
              <p className="text-2xl font-bold text-green-600">
                {keys.filter(k => !k.expiresAt || new Date(k.expiresAt) > new Date()).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">文档</p>
              <Button variant="link" className="p-0 h-auto">
                <Book className="h-4 w-4 mr-1" />
                查看 API 文档
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>API 密钥</CardTitle>
              <CardDescription>
                管理你的 API 密钥，{keys.length} 个密钥
              </CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger render={<Button />}>
                <Plus className="mr-2 h-4 w-4" />
                创建密钥
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateKey}>
                  <DialogHeader>
                    <DialogTitle>创建 API 密钥</DialogTitle>
                    <DialogDescription>
                      给密钥起个名字，方便以后识别
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">密钥名称</Label>
                      <Input
                        id="name"
                        placeholder="例如：生产环境"
                        value={keyName}
                        onChange={(e) => setKeyName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={creating}>
                      {creating ? '创建中...' : '创建密钥'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>密钥</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>最后使用</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Key className="h-8 w-8" />
                      <p>暂无 API 密钥</p>
                      <p className="text-sm">点击"创建密钥"开始</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                keys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>
                      <div className="font-medium">{key.name}</div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {key.keyPrefix}
                      </code>
                    </TableCell>
                    <TableCell>
                      {new Date(key.createdAt).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      {key.lastUsedAt ? (
                        new Date(key.lastUsedAt).toLocaleDateString('zh-CN')
                      ) : (
                        <span className="text-muted-foreground">从未使用</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {key.expiresAt && new Date(key.expiresAt) < new Date() ? (
                        <Badge variant="destructive">已过期</Badge>
                      ) : (
                        <Badge variant="secondary">活跃</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRevoke(key.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            快速开始
          </CardTitle>
          <CardDescription>
            使用 API 密钥访问 ViciVidi AI 服务
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">1. 设置 API 密钥</h4>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
              <code>{`export VICIVIDI_API_KEY="sk_live_your_api_key"`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">2. 调用 API</h4>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
              <code>{`curl -X GET "https://api.vicividi.ai/v1/companies" \\
  -H "Authorization: Bearer sk_live_your_api_key" \\
  -H "Content-Type: application/json"`}</code>
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">3. 示例代码</h4>
            <div className="grid gap-2 md:grid-cols-2">
              <Button variant="outline" className="justify-start">
                <Code className="mr-2 h-4 w-4" />
                Python SDK
              </Button>
              <Button variant="outline" className="justify-start">
                <Code className="mr-2 h-4 w-4" />
                Node.js SDK
              </Button>
              <Button variant="outline" className="justify-start">
                <Code className="mr-2 h-4 w-4" />
                cURL 示例
              </Button>
              <Button variant="outline" className="justify-start">
                <Book className="mr-2 h-4 w-4" />
                完整文档
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Key Display Dialog */}
      {newKey && (
        <Dialog open={!!newKey} onOpenChange={() => setNewKey(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API 密钥已创建</DialogTitle>
              <DialogDescription className="text-destructive">
                请安全保存此密钥，它将只显示一次！
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>密钥名称</Label>
                <div className="mt-1 font-medium">{newKey.name}</div>
              </div>

              <div>
                <Label>API 密钥</Label>
                <div className="flex gap-2 mt-1">
                  <code className="flex-1 bg-muted p-3 rounded text-sm break-all">
                    {newKey.key}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(newKey.key!)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded">
                <Shield className="h-4 w-4 mt-0.5" />
                <p>
                  此密钥仅在创建时显示一次。请将其保存在安全的地方，不要分享给他人。
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setNewKey(null)}>
                我知道了
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Usage Limits */}
      <Card>
        <CardHeader>
          <CardTitle>使用限制</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• API 调用受套餐配额限制</p>
          <p>• 每个密钥都有独立的调用统计</p>
          <p>• 可随时撤销密钥以停止访问</p>
          <p>• 建议为不同环境创建不同的密钥</p>
        </CardContent>
      </Card>
    </div>
  )
}
