'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Settings as SettingsIcon,
  Database,
  Mail,
  CreditCard,
  Globe,
  Save,
  RefreshCw,
  Key,
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    // 基本设置
    siteName: 'ViciVidi',
    siteUrl: 'https://vicividi.com',
    supportEmail: 'support@vicividi.com',
    defaultLanguage: 'zh-CN',
    
    // 用户设置
    allowRegistration: true,
    requireEmailVerification: true,
    defaultUserRole: 'user',
    
    // 配额设置
    defaultCompanyLimit: 1000,
    defaultLeadLimit: 10000,
    defaultApiCallsLimit: 10000,
    
    // 邮件设置
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpFrom: 'ViciVidi <noreply@vicividi.com>',
    
    // Stripe 设置
    stripeEnabled: true,
    stripeWebhookEnabled: true,
  })

  const handleSave = async () => {
    setLoading(true)
    // TODO: 调用 API 保存设置
    setTimeout(() => setLoading(false), 1000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">系统设置</h1>
          <p className="text-muted-foreground mt-1">
            配置系统参数和全局选项
          </p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? '保存中...' : '保存设置'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="general">基本设置</TabsTrigger>
          <TabsTrigger value="user">用户与配额</TabsTrigger>
          <TabsTrigger value="email">邮件服务</TabsTrigger>
          <TabsTrigger value="payment">支付配置</TabsTrigger>
        </TabsList>

        {/* 基本设置 */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                站点配置
              </CardTitle>
              <CardDescription>
                配置站点基本信息和全局参数
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siteName">站点名称</Label>
                  <Input
                    id="siteName"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">站点 URL</Label>
                  <Input
                    id="siteUrl"
                    value={settings.siteUrl}
                    onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">支持邮箱</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultLanguage">默认语言</Label>
                  <Select
                    value={settings.defaultLanguage}
                    onValueChange={(value) => setSettings({ ...settings, defaultLanguage: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-CN">简体中文</SelectItem>
                      <SelectItem value="en-US">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 用户与配额 */}
        <TabsContent value="user" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                用户设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>允许新用户注册</Label>
                  <p className="text-sm text-muted-foreground">
                    关闭后新用户无法注册账号
                  </p>
                </div>
                <Switch
                  checked={settings.allowRegistration}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowRegistration: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>需要邮箱验证</Label>
                  <p className="text-sm text-muted-foreground">
                    新用户需要验证邮箱才能登录
                  </p>
                </div>
                <Switch
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) => setSettings({ ...settings, requireEmailVerification: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                默认配额限制
              </CardTitle>
              <CardDescription>
                新用户注册时的默认配额限制
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="companyLimit">公司数量限制</Label>
                  <Input
                    id="companyLimit"
                    type="number"
                    value={settings.defaultCompanyLimit}
                    onChange={(e) => setSettings({ ...settings, defaultCompanyLimit: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadLimit">线索数量限制</Label>
                  <Input
                    id="leadLimit"
                    type="number"
                    value={settings.defaultLeadLimit}
                    onChange={(e) => setSettings({ ...settings, defaultLeadLimit: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiCallsLimit">API 调用次数</Label>
                  <Input
                    id="apiCallsLimit"
                    type="number"
                    value={settings.defaultApiCallsLimit}
                    onChange={(e) => setSettings({ ...settings, defaultApiCallsLimit: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 邮件服务 */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                SMTP 配置
              </CardTitle>
              <CardDescription>
                配置邮件发送服务
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP 主机</Label>
                  <Input
                    id="smtpHost"
                    placeholder="smtp.example.com"
                    value={settings.smtpHost}
                    onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP 端口</Label>
                  <Input
                    id="smtpPort"
                    placeholder="587"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpUser">SMTP 用户名</Label>
                <Input
                  id="smtpUser"
                  value={settings.smtpUser}
                  onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpFrom">发件人</Label>
                <Input
                  id="smtpFrom"
                  value={settings.smtpFrom}
                  onChange={(e) => setSettings({ ...settings, smtpFrom: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  测试连接
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 支付配置 */}
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Stripe 配置
              </CardTitle>
              <CardDescription>
                管理支付和订阅设置
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用 Stripe 支付</Label>
                  <p className="text-sm text-muted-foreground">
                    允许用户通过 Stripe 订阅付费
                  </p>
                </div>
                <Switch
                  checked={settings.stripeEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, stripeEnabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用 Webhook</Label>
                  <p className="text-sm text-muted-foreground">
                    接收 Stripe 支付事件通知
                  </p>
                </div>
                <Switch
                  checked={settings.stripeWebhookEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, stripeWebhookEnabled: checked })}
                />
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Webhook Endpoint</p>
                    <code className="block text-xs bg-background p-2 rounded mt-1">
                      https://vicividi.com/api/billing/webhook
                    </code>
                    <p className="text-xs text-muted-foreground mt-2">
                      请在 Stripe Dashboard 中配置此 URL 以接收支付事件
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
