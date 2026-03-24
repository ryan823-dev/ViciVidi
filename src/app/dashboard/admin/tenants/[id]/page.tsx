"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getTenantDetail, updateTenantStatus } from "@/actions/admin";
import { updateTenantEmailConfig, getTenantEmailConfig } from "@/actions/admin-email-config";

type TenantDetail = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  createdAt: Date;
  users: {
    id: string;
    name: string | null;
    email: string;
    lastLoginAt: Date | null;
    role: { displayName: string };
  }[];
  _count: {
    products: number;
    seoContents: number;
    socialPosts: number;
    leads: number;
  };
};

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  // 邮件配置状态
  const [emailConfig, setEmailConfig] = useState({
    website: '',
    resendApiKey: '',
    fromEmail: '',
    replyToEmail: '',
    hasResendApiKey: false,
    resendApiKeyPrefix: '',
    usePlatformKey: true,
  });
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);

  const tenantId = params.id as string;
  const locale = params.locale as string;

  useEffect(() => {
    async function loadTenant() {
      try {
        const data = await getTenantDetail(tenantId);
        setTenant(data as TenantDetail | null);
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    }
    loadTenant();
  }, [tenantId]);

  useEffect(() => {
    async function loadEmailConfig() {
      setConfigLoading(true);
      try {
        const result = await getTenantEmailConfig(tenantId);
        if (result.success && result.config) {
          setEmailConfig({
            website: result.config.website || '',
            resendApiKey: '',
            fromEmail: result.config.fromEmail || '',
            replyToEmail: result.config.replyToEmail || '',
            hasResendApiKey: result.config.hasResendApiKey,
            resendApiKeyPrefix: result.config.resendApiKeyPrefix || '',
            usePlatformKey: result.config.usePlatformKey,
          });
        }
      } catch {
        // error
      } finally {
        setConfigLoading(false);
      }
    }
    loadEmailConfig();
  }, [tenantId]);

  async function handleToggleStatus() {
    if (!tenant) return;
    setStatusLoading(true);
    const newStatus = tenant.status === "active" ? "suspended" : "active";
    try {
      const result = await updateTenantStatus(tenant.id, newStatus);
      if (result.success) {
        setTenant({ ...tenant, status: newStatus });
        toast.success(
          newStatus === "active" ? "已激活租户" : "已暂停租户"
        );
      }
    } catch {
      toast.error("操作失败");
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleSaveEmailConfig() {
    setConfigSaving(true);
    try {
      const result = await updateTenantEmailConfig(tenantId, {
        website: emailConfig.website || undefined,
        resendApiKey: emailConfig.resendApiKey || undefined,
        fromEmail: emailConfig.fromEmail || undefined,
        replyToEmail: emailConfig.replyToEmail || undefined,
      });
      if (result.success) {
        toast.success('邮件配置已保存');
        // 重新加载配置
        const reloadResult = await getTenantEmailConfig(tenantId);
        if (reloadResult.success && reloadResult.config) {
          setEmailConfig(prev => ({
            ...prev,
            resendApiKey: '',
            hasResendApiKey: reloadResult.config!.hasResendApiKey,
            resendApiKeyPrefix: reloadResult.config!.resendApiKeyPrefix || '',
            usePlatformKey: reloadResult.config!.usePlatformKey,
          }));
        }
      } else {
        toast.error(result.error || '保存失败');
      }
    } catch {
      toast.error('保存失败');
    } finally {
      setConfigSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="租户详情" />
        <div className="text-sm text-muted-foreground py-8 text-center">
          加载中...
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div>
        <PageHeader title="租户详情" />
        <div className="text-sm text-muted-foreground py-8 text-center">
          未找到租户
        </div>
      </div>
    );
  }

  const isActive = tenant.status === "active";

  return (
    <div>
      <PageHeader title={tenant.name} description={tenant.slug}>
        <Button variant="ghost" onClick={() => router.push(`/${locale}/admin`)}>
          返回列表
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant={isActive ? "outline" : "default"}
              disabled={statusLoading}
            >
              {isActive ? "暂停" : "激活"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isActive ? "暂停租户" : "激活租户"}
              </DialogTitle>
              <DialogDescription>
                {isActive ? "确定要暂停此租户吗？租户将无法访问系统。" : "确定要激活此租户吗？租户将恢复访问权限。"}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={handleToggleStatus}
                disabled={statusLoading}
                variant={isActive ? "destructive" : "default"}
              >
                {statusLoading ? "..." : isActive ? "暂停" : "激活"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">租户名称</span>
              <span className="font-medium">{tenant.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">租户标识</span>
              <span className="font-medium">{tenant.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">租户套餐</span>
              <Badge variant="secondary">
                {tenant.plan === "free" ? "免费版" : tenant.plan === "pro" ? "专业版" : "企业版"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">租户状态</span>
              <Badge
                variant="outline"
                className={
                  isActive
                    ? "text-green-600 border-green-200"
                    : "text-red-600 border-red-200"
                }
              >
                {isActive ? "正常" : "已暂停"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">创建日期</span>
              <span className="font-medium">
                {new Date(tenant.createdAt).toLocaleDateString(locale)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle>使用统计</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">产品数量</span>
              <span className="font-medium">{tenant._count.products}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">内容数量</span>
              <span className="font-medium">{tenant._count.seoContents}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">社媒帖子</span>
              <span className="font-medium">{tenant._count.socialPosts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">线索数量</span>
              <span className="font-medium">{tenant._count.leads}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Configuration */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            邮件配置
            {configLoading && <span className="text-sm text-muted-foreground font-normal">加载中...</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* 外贸网站域名 */}
            <div className="space-y-2">
              <Label htmlFor="website">外贸网站域名</Label>
              <Input
                id="website"
                placeholder="例如: example.com"
                value={emailConfig.website}
                onChange={(e) => setEmailConfig({ ...emailConfig, website: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                用于生成个性化内容和链接
              </p>
            </div>

            {/* Resend API Key */}
            <div className="space-y-2">
              <Label htmlFor="resendApiKey">Resend API Key</Label>
              <Input
                id="resendApiKey"
                type="password"
                placeholder={emailConfig.hasResendApiKey ? `已配置 (${emailConfig.resendApiKeyPrefix})` : "re_xxx..."}
                value={emailConfig.resendApiKey}
                onChange={(e) => setEmailConfig({ ...emailConfig, resendApiKey: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                {emailConfig.usePlatformKey 
                  ? '当前使用平台统一Key，填写后将使用客户专属Key'
                  : '当前使用客户专属Key，留空保持不变'}
              </p>
            </div>

            {/* 发件人邮箱 */}
            <div className="space-y-2">
              <Label htmlFor="fromEmail">发件人邮箱</Label>
              <Input
                id="fromEmail"
                placeholder="例如: 公司名称 <noreply@example.com>"
                value={emailConfig.fromEmail}
                onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                显示在邮件「发件人」字段
              </p>
            </div>

            {/* 回复邮箱 */}
            <div className="space-y-2">
              <Label htmlFor="replyToEmail">回复邮箱</Label>
              <Input
                id="replyToEmail"
                placeholder="例如: sales@example.com"
                value={emailConfig.replyToEmail}
                onChange={(e) => setEmailConfig({ ...emailConfig, replyToEmail: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                客户回复邮件时发送到此地址
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveEmailConfig} disabled={configSaving}>
              {configSaving ? '保存中...' : '保存配置'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            用户列表 ({tenant.users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tenant.users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{user.name || "-"}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{user.role.displayName}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {user.lastLoginAt
                      ? `最后登录：${new Date(user.lastLoginAt).toLocaleDateString(locale)}`
                      : "从未登录"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
