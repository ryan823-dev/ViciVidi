'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Building2, 
  Check, 
  Copy, 
  ExternalLink, 
  Key, 
  Link2, 
  Loader2, 
  Plug, 
  Settings, 
  Shield,
  Sparkles,
  Trash2,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

interface CRMConfig {
  id: string
  name: string
  description: string
  icon: string
  color: string
  gradient: string
  status: 'connected' | 'disconnected' | 'configuring'
  features: string[]
  authType: 'oauth' | 'apikey' | 'basic'
  fields: Array<{
    name: string
    label: string
    type: 'text' | 'password' | 'select'
    placeholder?: string
    required?: boolean
    options?: string[]
  }>
  guideUrl: string
}

const CRM_CONFIGS: CRMConfig[] = [
  {
    id: 'hubspot',
    name: 'HubSpot CRM',
    description: '全球最受欢迎的 CRM，适合中小企业',
    icon: '🟠',
    color: 'from-orange-500 to-orange-600',
    gradient: 'from-orange-500/10 to-orange-600/5',
    status: 'disconnected',
    features: ['联系人同步', '公司同步', '交易管理', '邮件追踪'],
    authType: 'apikey',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password', placeholder: '输入 HubSpot API Key', required: true },
    ],
    guideUrl: 'https://app.hubspot.com/developer',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: '企业级 CRM 领导者，功能强大',
    icon: '🔵',
    color: 'from-blue-500 to-blue-600',
    gradient: 'from-blue-500/10 to-blue-600/5',
    status: 'disconnected',
    features: ['Lead 管理', 'Account 管理', 'Contact 管理', '自定义对象'],
    authType: 'oauth',
    fields: [
      { name: 'clientId', label: 'Client ID', type: 'text', placeholder: '输入 Client ID', required: true },
      { name: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: '输入 Client Secret', required: true },
      { name: 'username', label: 'Username', type: 'text', placeholder: 'Salesforce 用户名', required: true },
      { name: 'password', label: 'Password', type: 'password', placeholder: 'Salesforce 密码', required: true },
      { name: 'securityToken', label: 'Security Token', type: 'password', placeholder: '输入安全令牌', required: false },
    ],
    guideUrl: 'https://developer.salesforce.com',
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: '以销售流程为核心的 CRM',
    icon: '🟢',
    color: 'from-green-500 to-green-600',
    gradient: 'from-green-500/10 to-green-600/5',
    status: 'disconnected',
    features: ['交易管理', '联系人管理', '组织管理', '销售报表'],
    authType: 'apikey',
    fields: [
      { name: 'apiToken', label: 'API Token', type: 'password', placeholder: '输入 Pipedrive API Token', required: true },
    ],
    guideUrl: 'https://developers.pipedrive.com',
  },
  {
    id: 'webhook',
    name: 'Webhook',
    description: '通用 Webhook，连接任意系统',
    icon: '🔗',
    color: 'from-purple-500 to-purple-600',
    gradient: 'from-purple-500/10 to-purple-600/5',
    status: 'disconnected',
    features: ['自定义 Payload', '多种认证方式', '自动重试', '执行日志'],
    authType: 'basic',
    fields: [
      { name: 'url', label: 'Webhook URL', type: 'text', placeholder: 'https://example.com/webhook', required: true },
      { name: 'method', label: 'HTTP Method', type: 'select', options: ['POST', 'PUT', 'PATCH'], required: true },
      { name: 'authType', label: '认证方式', type: 'select', options: ['none', 'basic', 'bearer'], required: true },
      { name: 'username', label: 'Username (Basic Auth)', type: 'text', placeholder: '用户名', required: false },
      { name: 'password', label: 'Password (Basic/Bearer)', type: 'password', placeholder: '密码或 Token', required: false },
      { name: 'payloadTemplate', label: 'Payload 模板 (JSON)', type: 'text', placeholder: '{ "lead": "{{lead}}", "company": "{{company}}" }', required: false },
    ],
    guideUrl: '#',
  },
]

export default function CRMIntegrationsPage() {
  const [selectedCRM, setSelectedCRM] = useState<CRMConfig | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})

  const handleConnect = async () => {
    if (!selectedCRM) return
    
    setIsConnecting(true)
    try {
      // 模拟连接过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(`${selectedCRM.name} 连接成功！`)
      setDialogOpen(false)
    } catch (error) {
      toast.error(`连接 ${selectedCRM.name} 失败`)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = (crmId: string) => {
    toast.success('已断开连接')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('已复制到剪贴板')
  }

  return (
    <div className="space-y-8">
      {/* 头部 */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 border border-primary/20 shadow-glow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl opacity-30" />
        
        <div className="relative space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Plug className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Integration</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-chart-2 bg-clip-text text-transparent">
            CRM 集成
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            连接您常用的 CRM 系统，实现线索、联系人和公司的双向同步
          </p>
        </div>
      </div>

      {/* CRM 列表 */}
      <div className="grid gap-6 md:grid-cols-2">
        {CRM_CONFIGS.map((crm) => (
          <Card 
            key={crm.id}
            className="relative overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group cursor-pointer"
            onClick={() => {
              setSelectedCRM(crm)
              setDialogOpen(true)
            }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${crm.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${crm.color} flex items-center justify-center text-3xl shadow-lg`}>
                    {crm.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">{crm.name}</h3>
                    <p className="text-sm text-muted-foreground">{crm.description}</p>
                  </div>
                </div>
                
                {crm.status === 'connected' ? (
                  <Badge className="bg-success/10 text-success border-success/20">
                    <Check className="h-3 w-3 mr-1" />
                    已连接
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-muted-foreground/20">
                    未连接
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {crm.features.map((feature) => (
                  <Badge 
                    key={feature} 
                    variant="secondary"
                    className="bg-muted/50 text-xs"
                  >
                    {feature}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {crm.status === 'connected' ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1 border-success/20 hover:bg-success/10 hover:border-success/30 transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDisconnect(crm.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      断开连接
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedCRM(crm)
                        setDialogOpen(true)
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button 
                    className={`flex-1 bg-gradient-to-r ${crm.color} hover:opacity-90 transition-all duration-300 shadow-lg`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCRM(crm)
                      setDialogOpen(true)
                    }}
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    立即连接
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(crm.guideUrl, '_blank')
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 连接对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedCRM && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedCRM.color} flex items-center justify-center text-2xl`}>
                    {selectedCRM.icon}
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold">
                      连接 {selectedCRM.name}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedCRM.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {selectedCRM.fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name} className="flex items-center gap-2">
                      {field.label}
                      {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    
                    {field.type === 'select' ? (
                      <Select 
                        value={formData[field.name] || field.options?.[0]}
                        onValueChange={(value) => setFormData({ ...formData, [field.name]: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={field.name}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        className="transition-all duration-300 focus:border-primary/50"
                      />
                    )}
                  </div>
                ))}

                <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50 border border-muted-foreground/10">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    您的凭证将加密存储，仅用于 API 认证
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button 
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className={`bg-gradient-to-r ${selectedCRM.color} hover:opacity-90 transition-all duration-300`}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      连接中...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      开始连接
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
