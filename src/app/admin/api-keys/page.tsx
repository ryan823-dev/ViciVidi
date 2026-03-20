'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Check,
  Eye,
  EyeOff,
  Shield,
  Clock,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ApiKey {
  id: string
  name: string
  key: string
  permissions: string[]
  created_at: string
  last_used_at?: string
  status: 'active' | 'inactive'
}

export default function AdminApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([])
  const [generatedKey, setGeneratedKey] = useState('')
  const [copied, setCopied] = useState(false)

  const handleCreateKey = () => {
    // TODO: 调用 API 创建密钥
    const mockKey = `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
    setGeneratedKey(mockKey)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const permissions = [
    { id: 'read:companies', label: '读取公司' },
    { id: 'write:companies', label: '写入公司' },
    { id: 'read:leads', label: '读取线索' },
    { id: 'write:leads', label: '写入线索' },
    { id: 'read:analytics', label: '读取分析' },
    { id: 'admin:all', label: '管理员权限' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API 密钥管理</h1>
          <p className="text-muted-foreground mt-1">
            管理系统 API 访问密钥和权限
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              创建密钥
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            {!generatedKey ? (
              <>
                <DialogHeader>
                  <DialogTitle>创建新的 API 密钥</DialogTitle>
                  <DialogDescription>
                    创建一个新的 API 密钥用于系统访问。请妥善保管，密钥只会显示一次。
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">密钥名称</Label>
                    <Input
                      id="name"
                      placeholder="例如：生产环境 - 数据分析"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>权限</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {permissions.map((perm) => (
                        <div
                          key={perm.id}
                          className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                            newKeyPermissions.includes(perm.id)
                              ? 'border-primary bg-primary/5'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            setNewKeyPermissions(prev =>
                              prev.includes(perm.id)
                                ? prev.filter(p => p !== perm.id)
                                : [...prev, perm.id]
                            )
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={newKeyPermissions.includes(perm.id)}
                            onChange={() => {}}
                            className="h-4 w-4"
                          />
                          <Label className="text-sm font-normal cursor-pointer">
                            {perm.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    取消
                  </Button>
                  <Button onClick={handleCreateKey}>
                    <Key className="mr-2 h-4 w-4" />
                    生成密钥
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>API 密钥已生成</DialogTitle>
                  <DialogDescription>
                    请复制并保存此密钥。关闭对话框后将无法再次查看。
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-sm break-all">
                    {generatedKey}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCopy} className="flex-1">
                      {copied ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      {copied ? '已复制' : '复制密钥'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setGeneratedKey('')
                        setShowCreateDialog(false)
                        setNewKeyName('')
                        setNewKeyPermissions([])
                      }}
                    >
                      完成
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* API Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle>API 密钥列表</CardTitle>
          <CardDescription>
            管理所有活跃的 API 密钥及其权限
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>密钥</TableHead>
                <TableHead>权限</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>最后使用</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Key className="h-12 w-12 mb-2 opacity-50" />
                      <p>暂无 API 密钥</p>
                      <p className="text-sm">点击上方"创建密钥"按钮添加第一个密钥</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{key.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="relative rounded bg-muted px-2 py-1 text-xs font-mono">
                        {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {key.permissions.map((perm) => (
                          <Badge key={perm} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(key.created_at).toLocaleDateString('zh-CN')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {key.last_used_at ? (
                        <div className="text-sm text-muted-foreground">
                          {new Date(key.last_used_at).toLocaleString('zh-CN')}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">从未使用</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                        {key.status === 'active' ? '活跃' : '停用'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>操作</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            查看密钥
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Shield className="mr-2 h-4 w-4" />
                            修改权限
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            {key.status === 'active' ? '停用' : '启用'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除密钥
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-yellow-500" />
            安全提示
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• API 密钥是敏感凭据，请妥善保管，不要提交到代码仓库</p>
          <p>• 建议定期轮换 API 密钥以提高安全性</p>
          <p>• 仅授予必要的最小权限</p>
          <p>• 如发现密钥泄露，请立即删除并重新生成</p>
        </CardContent>
      </Card>
    </div>
  )
}

function MoreHorizontal({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  )
}
